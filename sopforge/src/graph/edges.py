"""
Conditional edge routing functions for the LangGraph.
These functions determine which node to visit next based on state.
"""

from typing import Literal
from src.models import GraphState, SOPForgeConfig


def check_for_revisions(state: GraphState) -> Literal["editor", "human_in_the_loop"]:
    """
    Route based on reviewer's feedback.
    
    If review_notes == "PERFECT", skip to human checkpoint.
    Otherwise, go to editor for revisions.
    
    Args:
        state: Current graph state
    
    Returns:
        Node name to route to
    """
    review_notes = state.get("review_notes", "").strip().upper()
    
    if review_notes == "PERFECT":
        return "human_in_the_loop"
    else:
        return "editor"


def check_iteration_count(state: GraphState) -> Literal["reviewer", "human_in_the_loop"]:
    """
    Route based on iteration count to prevent infinite loops.
    
    If iteration_count > MAX_ITERATIONS, skip to human.
    Otherwise, loop back to reviewer.
    
    Args:
        state: Current graph state
    
    Returns:
        Node name to route to
    """
    iteration_count = state.get("iteration_count", 0)
    
    if iteration_count >= SOPForgeConfig.MAX_ITERATIONS:
        return "human_in_the_loop"
    else:
        return "reviewer"


def check_human_feedback(state: GraphState) -> Literal["editor", "__end__"]:
    """
    Route based on human feedback at HITL checkpoint.
    
    If human_feedback == "APPROVE", end.
    Otherwise, route back to editor with new instructions.
    
    Args:
        state: Current graph state
    
    Returns:
        Node name to route to
    """
    human_feedback = state.get("human_feedback", "").strip().upper()
    
    if human_feedback == "APPROVE":
        return "__end__"
    else:
        return "editor"
