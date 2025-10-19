import os
import google.generativeai as genai
from langchain_core.prompts import ChatPromptTemplate
from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.sqlite import SqliteSaver
from ..tools.safe_tools import safe_tools_list
from ..tools.dynamic_tools import dynamic_tools_list
from .nodes import (
    conversation_node,
    route_tools,
)
from .state import AICompanionState

def create_workflow_graph():
    graph = StateGraph(AICompanionState)
    graph.add_node("conversation", conversation_node)

    graph.add_conditional_edges(
        "conversation",
        route_tools,
        {
            "safe_tools": END,
            END: END,
        },
    )

    graph.set_entry_point("conversation")
    return graph

def get_graph(checkpointer):
    graph = create_workflow_graph()
    return graph.compile(checkpointer=checkpointer)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
llm = genai.GenerativeModel(
    "gemini-1.5-pro-latest",
)
all_tools = safe_tools_list + dynamic_tools_list
graph_builder = create_workflow_graph()