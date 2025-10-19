from langchain_core.tools import tool

@tool
def news_tool(query: str) -> str:
    """A placeholder tool for the NewsAgent."""
    return f"Response from NewsAgent for: {query}"
