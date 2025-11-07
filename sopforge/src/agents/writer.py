"""
WriterAgent: Crafts the compelling SOP draft.
Role: "Creative Drafter" - writes engaging, personalized narrative.
"""

from src.models import GraphState, SOPForgeConfig
from src.agents.base import (
    get_model,
    format_state_for_context,
    safe_invoke_model,
)
from src.utils.prompts import WRITER_SYSTEM_PROMPT


def run_writer(state: GraphState) -> dict:
    """
    Writer node: Generate initial SOP draft.
    
    Inputs:
        - user_prompt: User's goal
        - user_profile: User's background
        - research_findings: Program-specific research
    
    Outputs:
        - draft: Complete SOP draft (1000-1500 words)
        - review_notes: Reset to empty
    
    Args:
        state: Current graph state
    
    Returns:
        Updated state dict with draft and cleared review_notes
    """
    
    # Initialize model
    model = get_model(SOPForgeConfig.WRITER_MODEL, temperature=0.7)
    
    # Build context
    context = format_state_for_context(state)
    
    prompt = f"""{context}

## Your Task
Write a compelling, personalized Statement of Purpose (1000-1500 words) for this user.

Requirements:
1. **Opening Hook:** Start with a compelling statement that ties their motivation to the program
2. **Background & Motivation:** Showcase their achievements and unique strengths
3. **Why This Program?:** Explicitly reference specific faculty, labs, courses, or research areas from the research findings
4. **Future Vision:** Articulate their goals and how the program will help achieve them
5. **Closing:** End with confidence in their future impact

Style:
- Professional yet authentic - show genuine passion without clichés
- Specific: Use names, lab names, research areas from the research findings
- Coherent: Clear narrative arc from past to present to future
- Concise: Every sentence should advance the narrative

Write the complete SOP draft now:
"""
    
    draft = safe_invoke_model(
        model,
        prompt,
        system_message=WRITER_SYSTEM_PROMPT,
    )
    
    return {
        "draft": draft,
        "review_notes": "",  # Reset for new review cycle
        "messages": [{"role": "assistant", "content": "Writer created initial SOP draft."}]
    }
