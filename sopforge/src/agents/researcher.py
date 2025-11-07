"""
ResearcherAgent: Executes web searches and synthesizes findings.
Role: "Context Gatherer" - finds specific, credible information.
"""

from typing import Optional
from langchain_community.tools import GoogleSearchAPIWrapper
from src.models import GraphState, SOPForgeConfig
from src.agents.base import (
    get_model,
    format_state_for_context,
    safe_invoke_model,
)
from src.utils.prompts import RESEARCHER_SYSTEM_PROMPT
from src.config import settings


def run_researcher(state: GraphState) -> dict:
    """
    Researcher node: Execute web searches and synthesize findings.
    
    Inputs:
        - research_plan: List of search queries
    
    Outputs:
        - research_findings: Synthesized research summary
    
    Args:
        state: Current graph state
    
    Returns:
        Updated state dict with research_findings
    """
    
    research_plan = state.get("research_plan", [])
    
    if not research_plan:
        return {
            "research_findings": "No research queries were generated.",
            "messages": [{"role": "assistant", "content": "No research queries to execute."}]
        }
    
    # Execute searches
    search_results = _execute_searches(research_plan)
    
    if not search_results.strip():
        return {
            "research_findings": "No search results found.",
            "messages": [{"role": "assistant", "content": "Web search returned no results."}]
        }
    
    # Synthesize findings with LLM
    model = get_model(SOPForgeConfig.REVIEWER_MODEL, temperature=0.5)
    
    prompt = f"""You are synthesizing web search results into a coherent research summary.

## Search Results
{search_results}

## Task
Compile these results into a clear, organized research summary (500-800 words) that highlights:
1. Key faculty and their research interests
2. Program structure and values
3. Recent publications or achievements
4. Unique opportunities or resources
5. Program-specific strengths

Write the summary now, making it suitable for personalizing an SOP.
"""
    
    research_findings = safe_invoke_model(
        model,
        prompt,
        system_message=RESEARCHER_SYSTEM_PROMPT,
    )
    
    return {
        "research_findings": research_findings,
        "messages": [{"role": "assistant", "content": "Researcher synthesized web findings."}]
    }


def _execute_searches(queries: list[str]) -> str:
    """
    Execute web searches for all queries and format results.
    
    Args:
        queries: List of search queries
    
    Returns:
        Formatted search results string
    """
    search_wrapper = GoogleSearchAPIWrapper(
        google_api_key=settings.GOOGLE_API_KEY,
        google_cse_id=settings.GOOGLE_SEARCH_ENGINE_ID,
    )
    
    all_results = []
    
    for query in queries:
        try:
            results = search_wrapper.results(
                query,
                num_results=SOPForgeConfig.SEARCH_RESULTS_PER_QUERY
            )
            
            query_results = f"\n### Query: {query}\n"
            for i, result in enumerate(results, 1):
                query_results += (
                    f"\n**Result {i}:**\n"
                    f"Title: {result.get('title', 'N/A')}\n"
                    f"Link: {result.get('link', 'N/A')}\n"
                    f"Snippet: {result.get('snippet', 'N/A')}\n"
                )
            
            all_results.append(query_results)
        
        except Exception as e:
            print(f"Warning: Search failed for '{query}': {e}")
            continue
    
    return "\n".join(all_results) if all_results else ""
