import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model

from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition

from api.agent.tools import tools_list
from langgraph.checkpoint.memory import MemorySaver

from typing import AsyncIterator

load_dotenv()


llm = init_chat_model(
    "gemini-3-flash-preview", 
    model_provider="google_vertexai", 
    location="global",
    temperature=0
)


llm_with_tools = llm.bind_tools(tools_list)


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
   - For normal commands, politely refuse: "I'm sorry, but I can't perform device control actions for guests. Please ask the home owner."

--- DOMAIN RESTRICTION (VERY IMPORTANT) ---
You are ONLY allowed to help with smart home related topics, including:
- Checking home status (temperature, humidity, light, motion, device states, camera status)
- Controlling smart plugs (turning on/off)
- Controlling smart bulbs (on/off, brightness, colors)
- Executing Emergency and Security Protocols (SOS, calling for help)
- Answering questions about home automation or this system's capabilities

For ANY question OUTSIDE of smart home topics, you MUST politely decline and remind them you are a smart home assistant.

TOOLS:
1. 'get_home_status': Use for temperature, humidity, light, motion, device states, AND camera status.
2. 'control_smart_device': Use ONLY to turn plugs ON/OFF.
3. 'control_bulb': Use to control smart bulbs (on, off, set_brightness, set_color).
4. 'trigger_emergency_alert': CRITICAL! Use this IMMEDIATELY if the user explicitly asks for help, says they fell, feels sick, or reports a dangerous/emergency situation. Do not hesitate.

COLOR GUIDE (for set_color):
- Red: hue=0, saturation=100
- Orange: hue=30, saturation=100
- Yellow: hue=60, saturation=100
- Green: hue=120, saturation=100
- Cyan: hue=180, saturation=100
- Blue: hue=240, saturation=100
- Purple: hue=280, saturation=100
- Pink: hue=330, saturation=100
- White/Daylight: hue=0, saturation=0

CRITICAL RULES:
- NEVER answer questions outside of smart home domain.
- NEVER change device state unless user EXPLICITLY asks.
- If it is an EMERGENCY, act immediately and use the 'trigger_emergency_alert' tool.

Current Time: {time}
"""


async def agent_node(state: MessagesState):

    messages = state["messages"]

    turkey_timezone = timezone(timedelta(hours=3))
    current_time = datetime.now(turkey_timezone).strftime("%Y-%m-%d %H:%M:%S")
    
    formatted_prompt = SYSTEM_TEMPLATE.format(time=current_time)
    
    conversation_messages = [msg for msg in messages if not isinstance(msg, SystemMessage)]
    
    final_messages = [SystemMessage(content=formatted_prompt)] + conversation_messages
    
    response = await llm_with_tools.ainvoke(final_messages)
    
    return {"messages": [response]}


tool_node = ToolNode(tools_list)


workflow = StateGraph(MessagesState)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

workflow.add_edge(START, "agent")

workflow.add_conditional_edges(
    "agent",
    tools_condition,
)

workflow.add_edge("tools", "agent")

memory = MemorySaver()

app = workflow.compile(checkpointer=memory)


async def chat_with_ai(user_input: str, thread_id: str):
    """
    Main entry point for the chat API.
    """
    config = {"configurable": {"thread_id": thread_id}}
    input_message = HumanMessage(content=user_input)
    
    async for event in app.astream_events(
        {"messages": [input_message]}, 
        config=config, 
        version="v2"
    ):
        kind = event["event"]

        if kind == "on_chat_model_stream":
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