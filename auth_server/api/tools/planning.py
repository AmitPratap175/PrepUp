from langchain_core.tools import tool

@tool
def planning_tool(query: str) -> str:
    """A placeholder tool for the PlanningAgent."""
    return f"Response from PlanningAgent for: {query}"
