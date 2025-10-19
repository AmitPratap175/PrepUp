from langchain_core.tools import tool

@tool
def forum_tool(query: str) -> str:
    """A placeholder tool for the ForumAgent."""
    return f"Response from ForumAgent for: {query}"
