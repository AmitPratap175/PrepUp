from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from .nodes import (
    conversation_node,
    create_tool_node_with_fallback,
    route_tools,
    extract_question_context_node
)
from .state import AICompanionState
from ..tools.safe_tools import safe_tools_list
from ..tools.dynamic_tools import dynamic_tools_list

@lru_cache(maxsize=1)
def create_workflow_graph():
    graph_builder = StateGraph(AICompanionState)

    all_tools = safe_tools_list + dynamic_tools_list

    # Add all nodes
    # graph_builder.add_node("memory_extraction_node", memory_extraction_node)
    # graph_builder.add_node("memory_injection_node", memory_injection_node)
    graph_builder.add_node("extract_question_context_node", extract_question_context_node)
    graph_builder.add_node("conversation_node", conversation_node)
    graph_builder.add_node("safe_tools", create_tool_node_with_fallback(all_tools))

    # Define the flow
    # First extract memories from user message
    # graph_builder.add_edge(START, "memory_extraction_node")
    graph_builder.add_edge(START, "extract_question_context_node")
    graph_builder.add_edge("extract_question_context_node", "conversation_node")


    # Then determine response type
    # graph_builder.add_edge("memory_extraction_node", "memory_injection_node")

    # Then proceed to appropriate response node
    # graph_builder.add_edge("memory_injection_node", "conversation_node")

    graph_builder.add_conditional_edges(
        "conversation_node", route_tools, ["safe_tools", END]
    )
    graph_builder.add_edge("safe_tools", "conversation_node")
    # graph_builder.add_edge("sensitive_tools", "conversation_node")

    return graph_builder


# Compiled without a checkpointer. Used for LangGraph Studio
graph = create_workflow_graph().compile()
