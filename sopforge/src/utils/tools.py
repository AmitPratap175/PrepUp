"""
Tool wrappers for agent use, including Google Search.
"""

import os
from typing import Optional
from langchain_community.tools import GoogleSearchAPIWrapper
from langchain_core.tools import tool
from src.config import settings


# Initialize Google Search
search_wrapper = GoogleSearchAPIWrapper(
    google_api_key=settings.GOOGLE_API_KEY,
    google_cse_id=settings.GOOGLE_SEARCH_ENGINE_ID,
)


@tool
def google_search(query: str, num_results: int = 3) -> str:
    """
    Search the web using Google Custom Search.
    
    Args:
        query: Search query string
        num_results: Number of results to return (default 3)
    
    Returns:
        String containing search results with titles and snippets
    """
    try:
        results = search_wrapper.results(query, num_results=num_results)
        
        if not results:
            return f"No results found for: {query}"
        
        formatted_results = []
        for result in results:
            formatted_results.append(
                f"Title: {result.get('title', 'N/A')}\n"
                f"Link: {result.get('link', 'N/A')}\n"
                f"Snippet: {result.get('snippet', 'N/A')}\n"
            )
        
        return "\n---\n".join(formatted_results)
    
    except Exception as e:
        return f"Error searching: {str(e)}"


# Export for use in agents
TOOLS = [google_search]
TOOLS_MAP = {tool.name: tool for tool in TOOLS}
