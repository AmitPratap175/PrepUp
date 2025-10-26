from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent

from .state import AICompanionState
from ..tools.safe_tools import safe_tools_list
from ..tools.dynamic_tools import dynamic_tools_list
from .nodes import extract_question_context_node
from .utils.helpers import get_chat_model

def create_agent_graph():
    """
    Creates a ReAct agent graph.
    """
    # 1. Get the tools
    all_tools = safe_tools_list + dynamic_tools_list

    # 2. Get the model
    model = get_chat_model()

    # 3. Create the ReAct agent
    agent_runnable = create_react_agent(model, all_tools)

    # 4. Create a new graph and add the custom node
    workflow = StateGraph(AICompanionState)

    workflow.add_node("extract_context", extract_question_context_node)
    workflow.add_node("agent", agent_runnable)

    workflow.add_edge(START, "extract_context")
    workflow.add_edge("extract_context", "agent")
    workflow.add_edge("agent", END)

    return workflow

graph_builder = create_agent_graph()
