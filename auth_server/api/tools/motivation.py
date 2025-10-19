from langchain_core.tools import tool

@tool
def motivation_tool(query: str) -> str:
    """A placeholder tool for the MotivationAgent."""
    return f"Response from MotivationAgent for: {query}"
