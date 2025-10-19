from langchain_core.tools import tool

@tool
def comparison_tool(query: str) -> str:
    """A placeholder tool for the ComparisonAgent."""
    return f"Response from ComparisonAgent for: {query}"
