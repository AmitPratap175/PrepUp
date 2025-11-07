"""
EditorAgent: Implements feedback and refines the draft.
Role: "Re-writer" - implements revisions from reviewer or human feedback.
"""

from src.models import GraphState, SOPForgeConfig
from src.agents.base import (
    get_model,
    format_state_for_context,
    safe_invoke_model,
)
from src.utils.prompts import EDITOR_SYSTEM_PROMPT


def run_editor(state: GraphState) -> dict:
    """
    Editor node: Revise SOP based on feedback.
    
    Inputs:
        - draft: Current SOP draft
        - review_notes: Reviewer's feedback
        - human_feedback: Optional user feedback (takes priority)
    
    Outputs:
        - draft: Revised SOP
        - iteration_count: Incremented by 1
    
    Args:
        state: Current graph state
    
    Returns:
        Updated state dict with revised draft
    """
    
    # Determine which feedback to use (human > reviewer)
    feedback_to_use = state.get("human_feedback") or state.get("review_notes", "")
    
    if not feedback_to_use:
        # No feedback to apply
        return {
            "draft": state["draft"],
            "iteration_count": state.get("iteration_count", 0) + 1,
            "messages": [{"role": "assistant", "content": "No feedback to implement."}]
        }
    
    # Initialize model
    model = get_model(SOPForgeConfig.EDITOR_MODEL, temperature=0.6)
    
    # Build context
    context = format_state_for_context(state)
    
    prompt = f"""{context}

## Revision Instructions
You are the Editor. Your task is to revise the draft to address this feedback:

{feedback_to_use}

Guidelines:
1. Make targeted improvements, not a complete rewrite
2. Keep overall structure and voice
3. Add specificity where lacking
4. Refine flow and transitions
5. Remove generic language

Output the revised SOP draft in full:
"""
    
    revised_draft = safe_invoke_model(
        model,
        prompt,
        system_message=EDITOR_SYSTEM_PROMPT,
    )
    
    return {
        "draft": revised_draft,
        "iteration_count": state.get("iteration_count", 0) + 1,
        "messages": [{"role": "assistant", "content": "Editor revised the draft."}]
    }
