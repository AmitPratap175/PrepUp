from langchain_core.tools import tool

@tool
def erroranalysis_tool(query: str) -> str:
    """A placeholder tool for the ErrorAnalysisAgent."""
    return f"Response from ErrorAnalysisAgent for: {query}"
