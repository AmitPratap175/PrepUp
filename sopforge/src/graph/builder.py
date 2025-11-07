"""
LangGraph builder: Constructs the complete SOP generation graph.
Assembles all nodes, edges, and creates the compiled graph.
"""

from langgraph.graph import StateGraph, START, END
from src.models import GraphState
from src.graph.nodes import (
    node_planner,
    node_researcher,
    node_writer,
    node_reviewer,
    node_editor,
    node_human_in_the_loop,
)
from src.graph.edges import (
    check_for_revisions,
    check_iteration_count,
    check_human_feedback,
)
from src.graph.checkpointer import get_checkpointer


def build_sop_graph():
    """
    Build and compile the SOPForge LangGraph.
    
    Architecture:
    START
      ↓
    planner → researcher → writer → reviewer ↓
                                    ├─→ [PERFECT?]
                                    │    ↓
                                    └→ editor → [MAX_ITERATIONS?]
                                                ├→ reviewer (loop)
                                                └→ human_in_the_loop
                                    ↓
                              human_in_the_loop
                                    ↓
                              [APPROVE?]
                                    ├→ END
                                    └→ editor (revise)
                                         ↓
                                       reviewer
    
    Returns:
        Compiled LangGraph ready for invocation
    """
    
    # Initialize graph with state schema
    graph = StateGraph(GraphState)
    
    # Add all nodes
    graph.add_node("planner", node_planner)
    graph.add_node("researcher", node_researcher)
    graph.add_node("writer", node_writer)
    graph.add_node("reviewer", node_reviewer)
    graph.add_node("editor", node_editor)
    graph.add_node("human_in_the_loop", node_human_in_the_loop)
    
    # Add edges (linear flow until reviewer)
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "researcher")
    graph.add_edge("researcher", "writer")
    graph.add_edge("writer", "reviewer")
    
    # Conditional edge after reviewer
    graph.add_conditional_edges(
        "reviewer",
        check_for_revisions,
        {
            "editor": "editor",
            "human_in_the_loop": "human_in_the_loop",
        }
    )
    
    # Conditional edge after editor (iteration check)
    graph.add_conditional_edges(
        "editor",
        check_iteration_count,
        {
            "reviewer": "reviewer",
            "human_in_the_loop": "human_in_the_loop",
        }
    )
    
    # Conditional edge after human-in-the-loop
    graph.add_conditional_edges(
        "human_in_the_loop",
        check_human_feedback,
        {
            "editor": "editor",
            "__end__": END,
        }
    )
    
    # Compile with checkpointer (required for interrupts)
    checkpointer = get_checkpointer()
    compiled_graph = graph.compile(
        checkpointer=checkpointer,
        interrupt_before=["human_in_the_loop"],  # Pause before HITL node
    )
    
    return compiled_graph
