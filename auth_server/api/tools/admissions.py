from langchain_core.tools import tool

@tool
def admissions_tool(query: str) -> str:
    """A placeholder tool for the AdmissionsAgent."""
    return f"Response from AdmissionsAgent for: {query}"
