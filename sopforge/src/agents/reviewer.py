"""
ReviewerAgent: Internal critic that evaluates SOP quality.
Role: "Internal Critic" - provides actionable feedback or "PERFECT" signal.
"""

from src.models import GraphState, SOPForgeConfig
from src.agents.base import (
    get_model,
    format_state_for_context,
    safe_invoke_model,
)
from src.utils.prompts import REVIEWER_SYSTEM_PROMPT


def run_reviewer(state: GraphState) -> dict:
    """
    Reviewer node: Evaluate SOP draft and provide feedback.
    
    Inputs:
        - draft: Current SOP draft
        - user_prompt: User's goal
        - user_profile: User's background
        - research_findings: Program research
    
    Outputs:
        - review_notes: "PERFECT" or bulleted feedback
    
    Args:
        state: Current graph state
    
    Returns:
        Updated state dict with review_notes
    """
    
    # Initialize model (lower temperature for consistency)
    model = get_model(SOPForgeConfig.REVIEWER_MODEL, temperature=0.3)
    
    # Build context
    context = format_state_for_context(state)
    
    prompt = f"""{context}

## Evaluation Rubric
Assess the draft on these dimensions:
1. **Goal Alignment**: Does it directly address the user_prompt?
2. **Profile Integration**: Does it effectively showcase the user_profile?
3. **Research Specificity**: Are specific faculty, labs, or courses mentioned?
4. **Narrative Quality**: Clear story arc? Good flow?
5. **Tone & Grammar**: Professional tone? No typos?
6. **Uniqueness**: Stands out or generic?

## Response Format
If excellent across all dimensions, respond with ONLY:
PERFECT

If revisions needed, respond with bulleted list:
- [Issue 1]: [How to fix]
- [Issue 2]: [How to fix]
...

Evaluate now:
"""
    
    review_notes = safe_invoke_model(
        model,
        prompt,
        system_message=REVIEWER_SYSTEM_PROMPT,
    )
    
    return {
        "review_notes": review_notes,
        "messages": [{"role": "assistant", "content": "Reviewer evaluated the draft."}]
    }
