from langchain_core.tools import tool

@tool
def mindset_tool(query: str) -> str:
    """A placeholder tool for the MindsetAgent."""
    return f"Response from MindsetAgent for: {query}"
