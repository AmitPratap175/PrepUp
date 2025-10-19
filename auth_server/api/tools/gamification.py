from langchain_core.tools import tool

@tool
def gamification_tool(query: str) -> str:
    """A placeholder tool for the GamificationAgent."""
    return f"Response from GamificationAgent for: {query}"
