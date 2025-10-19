from typing import Annotated, Sequence, TypedDict
import operator
import os
import google.generativeai as genai

from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from .tools.planning import planning_tool

class PlanningAgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

tools = [planning_tool]
tool_node = ToolNode(tools)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
llm = genai.GenerativeModel(
    "gemini-1.5-pro-latest",
)

def _format_messages(messages: list) -> list:
    formatted_messages = []
    for msg in messages:
        if msg.type == "human":
            formatted_messages.append({"role": "user", "parts": [msg.content]})
        elif msg.type == "ai":
            formatted_messages.append({"role": "model", "parts": [msg.content]})
    return formatted_messages

prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant.",
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)

def agent_node(state: PlanningAgentState):
    messages = _format_messages(state["messages"])
    response = llm.generate_content(
        messages,
        tools=tools,
    )
    tool_calls = response.candidates[0].content.parts[0].function_call
    return {"messages": [BaseMessage(type="ai", content="", tool_calls=[tool_calls])]}


workflow = StateGraph(PlanningAgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    lambda state: "tools" if state["messages"][-1].tool_calls else END,
    {"tools": "tools", END: END},
)
workflow.add_edge("tools", "agent")

graph = workflow.compile()
