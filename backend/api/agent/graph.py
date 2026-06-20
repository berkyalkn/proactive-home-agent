import os
import re
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition

from api.agent.tools import tools_list
from langgraph.checkpoint.memory import MemorySaver

from typing import AsyncIterator

load_dotenv()

llm = ChatOpenAI(
    base_url="http://192.168.0.25:8080/v1",
    api_key="not-needed",
    model="mlx-community/Qwen3.6-35B-A3B-8bit",
    temperature=0.0,
    max_tokens=4096,     
    timeout=120,     
    max_retries=0       
)

llm_with_tools = llm.bind_tools(tools_list)

cloud_llm = init_chat_model(
    "gemini-3-flash-preview", 
    model_provider="google_vertexai", 
    location="global",
    temperature=0.7 
)


#llm = ChatOllama(
#    model="llama3.1",
#    base_url="http://100.119.128.11:11434",
#    temperature=0.0,
#)

def zero_trust_scrubber(text: str) -> str:
    """It cleans personal data, IP and MAC addresses before sending them to the cloud."""

    text = re.sub(r'\[User:.*?\]\s*', '', text)
    text = re.sub(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', '[MASKED_IP]', text)
    text = re.sub(r'(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})', '[MASKED_MAC]', text)
    return text.strip()


SYSTEM_TEMPLATE = """
You are a proactive Smart Home Assistant designed EXCLUSIVELY for home automation and home security tasks.
You have access to REAL-TIME sensor data, Smart Devices, and Emergency Protocols.

--- SECURITY & AUTHORIZATION PROTOCOL (TOP PRIORITY) ---
Every user message will start with an identification tag like `[User: Name]`.
You MUST check this tag before deciding to execute a command.

1. **AUTHORIZED USERS** (e.g. "Berkay", "Admin"):
   - You have FULL PERMISSION to control devices and trigger security protocols.
   - Execute the user's command immediately.

2. **GUESTS** (Tag says `[User: Guest]`):
   - **RESTRICTED MODE**: You can ONLY answer questions about status (Read-Only).
   - **FORBIDDEN**: You MUST NOT execute any command that changes the state of a device (turning on/off, changing color/brightness).
   - **EXCEPTION (EMERGENCY):** If a Guest explicitly cries for help, says they are injured, or asks to trigger an alarm, you MAY use the emergency alert tool.

TOOLS:
1. 'get_home_status': Use for temperature, humidity, light, motion, device states, AND camera status.
2. 'control_smart_device': Use ONLY to turn plugs ON/OFF.
3. 'control_bulb': Use to control smart bulbs (on, off, set_brightness, set_color).
4. 'trigger_emergency_alert': CRITICAL! Use this IMMEDIATELY if the user explicitly asks for help.

CRITICAL RULES:
-NEVER answer complex questions outside of the smart home domain. However, you CAN engage in brief, polite chit-chat (e.g., greetings, asking how you are) while maintaining your persona as the home assistant.
- If it is an EMERGENCY, act immediately and use the 'trigger_emergency_alert' tool.
- The home has an AI-powered camera system that can detect falls automatically. If you see a FALL DETECTED event in the presence history, acknowledge it proactively.
- TOOL ENFORCEMENT: If you decide to change a device's state, YOU MUST EXPLICITLY CALL the appropriate tool. 
- ALWAYS respond in a natural, conversational tone AFTER using a tool.
- Speak DIRECTLY to the user in the first person. Just give the actual answer.
- DATA EFFICIENCY: When asked for a specific data point (like temperature), use the 'get_home_status' tool EXACTLY ONCE. Extract the specific information, answer the user immediately, and DO NOT call the tool again.

Current Time: {time}
"""


async def route_query(state: MessagesState):
    """GATEKEEPER: Decides whether the problem goes to the local system or the cloud."""

    last_message = state["messages"][-1].content
    
    prompt = f"""You are a strict Gatekeeper for a Smart Home System.
    Analyze the following user query and output ONLY one word: "LOCAL" or "CLOUD".
    
    - Output "LOCAL" if the query is about controlling the house, security, memory, casual greetings, or if the user asks for creative writing, recipes, or coding help (which you will politely reject in the local node).
    - Output "CLOUD" ONLY if the query explicitly demands real-time external world data (e.g., weather, traffic, news, flights) or third-party external facts.
    
    User Query: "{last_message}"
    Decision:"""
    
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    decision = response.content.strip().upper()
    
    if "CLOUD" in decision:
        return "cloud_agent"
    return "local_agent"


async def local_agent_node(state: MessagesState):
    """The Local Brain, which controls the physical structure and memories of the home."""

    messages = state["messages"]
    turkey_timezone = timezone(timedelta(hours=3))
    current_time = datetime.now(turkey_timezone).strftime("%Y-%m-%d %H:%M:%S")
    
    formatted_prompt = SYSTEM_TEMPLATE.format(time=current_time)
    conversation_messages = [msg for msg in messages if not isinstance(msg, SystemMessage)]
    final_messages = [SystemMessage(content=formatted_prompt)] + conversation_messages
    
    response = await llm_with_tools.ainvoke(final_messages)
    return {"messages": [response]}


async def cloud_agent_node(state: MessagesState):
    """The External Brain (Gemini) that responds to general knowledge and complex requests."""

    last_message = state["messages"][-1].content
    
    scrubbed_query = zero_trust_scrubber(last_message)
    
    system_msg = SystemMessage(content="You are the External Data Module of a Smart Home ecosystem. Your SOLE purpose is to retrieve and summarize real-time external world data (like weather, traffic, directions, or factual news) requested by the user. Do NOT engage in open-domain chatting, creative writing, or roleplay. Keep your answers factual, concise, and task-oriented.")
    
    response = await cloud_llm.ainvoke([system_msg, HumanMessage(content=scrubbed_query)])
    return {"messages": [response]}


tool_node = ToolNode(tools_list)

workflow = StateGraph(MessagesState)

workflow.add_node("local_agent", local_agent_node)
workflow.add_node("cloud_agent", cloud_agent_node)
workflow.add_node("tools", tool_node)

workflow.add_conditional_edges(
    START,
    route_query,
    {
        "local_agent": "local_agent",
        "cloud_agent": "cloud_agent"
    }
)

workflow.add_conditional_edges(
    "local_agent",
    tools_condition,
)
workflow.add_edge("tools", "local_agent")

workflow.add_edge("cloud_agent", END)

memory = MemorySaver()
app = workflow.compile(checkpointer=memory)


async def chat_with_ai(user_input: str, thread_id: str):
    """Main entry point for the chat API."""

    config = {"configurable": {"thread_id": thread_id}}
    input_message = HumanMessage(content=user_input)
    
    async for event in app.astream_events(
        {"messages": [input_message]}, 
        config=config, 
        version="v2"
    ):
        kind = event["event"]

        if kind == "on_chat_model_stream":

            node_name = event.get("metadata", {}).get("langgraph_node")
            if node_name not in ["local_agent", "cloud_agent"]:
                continue

            data = event["data"]
            
            if "chunk" in data:
                chunk = data["chunk"]

                if chunk.tool_call_chunks:
                    continue

                if not chunk.content:
                    continue
                
                content = chunk.content
                
                if isinstance(content, list):
                    text_parts = []
                    for part in content:
                        if isinstance(part, str):
                            text_parts.append(part)
                        elif isinstance(part, dict) and "text" in part:
                            text_parts.append(part["text"])
                    yield "".join(text_parts)
                
                elif isinstance(content, str):
                    yield content

