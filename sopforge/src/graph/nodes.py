"""
Wrapper functions that integrate agents into LangGraph nodes.
Each node calls the corresponding agent and returns state updates.
"""

from langgraph.types import interrupt, Command
from src.models import GraphState
from src.agents.planner import run_planner
from src.agents.researcher import run_researcher
from src.agents.writer import run_writer
from src.agents.reviewer import run_reviewer
from src.agents.editor import run_editor


def node_planner(state: GraphState) -> dict:
    """LangGraph node: Planner Agent."""
    return run_planner(state)


def node_researcher(state: GraphState) -> dict:
    """LangGraph node: Researcher Agent."""
    return run_researcher(state)


def node_writer(state: GraphState) -> dict:
    """LangGraph node: Writer Agent."""
    return run_writer(state)


def node_reviewer(state: GraphState) -> dict:
    """LangGraph node: Reviewer Agent."""
    return run_reviewer(state)


def node_editor(state: GraphState) -> dict:
    """LangGraph node: Editor Agent."""
    return run_editor(state)


def node_human_in_the_loop(state: GraphState) -> dict:
    """
    Human-in-the-loop checkpoint: Pause and wait for user feedback.
    
    Uses LangGraph's interrupt() to pause execution and prompt the user.
    When resumed, human_feedback is set from user input.
    
    Args:
        state: Current graph state
    
    Returns:
        State with human_feedback populated
    """
    
    # Display current draft to user
    draft = state.get("draft", "No draft available")
    
    # Pause execution and capture user input
    user_input = interrupt(
        f"""
=== HUMAN REVIEW CHECKPOINT ===

Here is the current SOP draft:

{draft}

---

Please provide your feedback:
1. Type 'APPROVE' to accept this draft
2. Provide specific feedback for improvements (e.g., "Add more detail about...")

Your input:
"""
    )
    
    return {"human_feedback": user_input}
