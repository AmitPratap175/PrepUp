"""
PlannerAgent: Analyzes user goal and generates research plan.
Role: "Team Lead" - strategizes what information is needed.
"""

import json
from src.models import GraphState, SOPForgeConfig
from src.agents.base import (
    get_model,
    extract_json_from_response,
    format_state_for_context,
    safe_invoke_model,
)
from src.utils.prompts import PLANNER_SYSTEM_PROMPT


def run_planner(state: GraphState) -> dict:
    """
    Planner node: Generate research queries based on user goal and profile.
    
    Inputs:
        - user_prompt: User's SOP goal
        - user_profile: User's background
    
    Outputs:
        - research_plan: List of search queries
    
    Args:
        state: Current graph state
    
    Returns:
        Updated state dict with research_plan
    """
    
    # Initialize model (non-tool)
    model = get_model(SOPForgeConfig.PLANNER_MODEL, temperature=0.5)
    
    # Build prompt with context
    context = format_state_for_context(state)
    
    prompt = f"""{context}

Based on the above user goal and background, generate a research plan.
Generate ONLY a valid JSON object with this structure:
{{
    "queries": [
        "Query 1 for web search",
        "Query 2 for web search",
        ...
    ],
    "reasoning": "Brief explanation of search strategy"
}}

Remember:
- Generate {SOPForgeConfig.RESEARCH_QUERIES_LIMIT} focused, specific queries
- Each query should target specific faculty, labs, publications, or program details
- Prefer specific names over generic terms
- Examples: "Stanford AI Lab David Donoho machine learning" not "Stanford research"
"""
    
    # Invoke model
    response = safe_invoke_model(
        model,
        prompt,
        system_message=PLANNER_SYSTEM_PROMPT,
    )
    
    # Extract JSON
    try:
        plan_data = extract_json_from_response(response)
        research_plan = plan_data.get("queries", [])[:SOPForgeConfig.RESEARCH_QUERIES_LIMIT]
    except (ValueError, json.JSONDecodeError) as e:
        # Fallback: generate generic queries
        print(f"Warning: Failed to parse planner JSON: {e}")
        research_plan = _generate_fallback_queries(state['user_prompt'])
    
    return {
        "research_plan": research_plan,
        "messages": [{
            "role": "assistant",
            "content": f"Planner generated {len(research_plan)} research queries."
        }]
    }


def _generate_fallback_queries(user_prompt: str) -> list[str]:
    """
    Generate basic fallback queries if planner fails.
    
    Args:
        user_prompt: User's goal
    
    Returns:
        List of generic queries
    """
    # Extract key phrases from user prompt
    # Example: "MS in CS at Stanford focusing on AI" ->
    # ["Stanford CS", "Stanford AI", "Stanford CS program"]
    
    queries = []
    if "Stanford" in user_prompt:
        queries.extend([
            f"{q} Stanford" for q in ["CS program", "AI research", "faculty"]
        ])
    elif "MIT" in user_prompt:
        queries.extend([
            f"{q} MIT" for q in ["CS program", "AI lab", "faculty"]
        ])
    else:
        # Generic fallback
        queries = [
            "graduate program structure requirements",
            "graduate research opportunities",
            "faculty research interests",
        ]
    
    return queries[:SOPForgeConfig.RESEARCH_QUERIES_LIMIT]
