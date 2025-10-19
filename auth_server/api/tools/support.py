from langchain_core.tools import tool

@tool
def support_tool(query: str) -> str:
    """A placeholder tool for the SupportAgent."""
    return f"Response from SupportAgent for: {query}"
