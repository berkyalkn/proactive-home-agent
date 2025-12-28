import os
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model

from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition

from api.agent.tools import tools_list

load_dotenv()


llm = init_chat_model(
    "gemini-2.5-pro", 
    model_provider="google_vertexai", 
    temperature=0
)


llm_with_tools = llm.bind_tools(tools_list)


SYSTEM_PROMPT = """
You are a proactive Smart Home Assistant.
You have access to REAL-TIME sensor data and Smart Devices.

TOOLS:
1. 'get_environmental_status': Use for temperature, humidity, light, motion.
2. 'get_connected_devices_status': Use to CHECK if plugs/lights are ON or OFF.
3. 'control_smart_device': Use ONLY to CHANGE state (Turn On/Off).

CRITICAL RULES:
- NEVER turn a device ON or OFF unless the user EXPLICITLY asks for it.
- If the user asks "What is the status?", just READ the sensor and device status. DO NOT change anything.
- If asked about a room with no sensors (e.g., Guestroom), simply say you don't see data for it.
"""


async def agent_node(state: MessagesState):

    messages = state["messages"]
    
    if not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    
    response = await llm_with_tools.ainvoke(messages)
    
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

app = workflow.compile()


async def chat_with_ai(user_input: str, thread_id: str = "1"):
    """
    Main entry point for the chat API.
    """

    config = {"configurable": {"thread_id": thread_id}}
    
    input_message = HumanMessage(content=user_input)
    
    final_state = await app.ainvoke(
        {"messages": [input_message]},
        config=config
    )
    
    ai_response = final_state["messages"][-1].content

    # Gemini 2.5 Pro returns content as a list of objects, so it changed
    # We need to extract only the actual text parts
    if isinstance(ai_response, list):
        text_parts = [
            part.get('text', '') 
            for part in ai_response 
            if isinstance(part, dict) and part.get('type') == 'text'
        ]
        return " ".join(text_parts) if text_parts else str(ai_response)
    
    return str(ai_response)