from langchain_core.tools import tool

@tool
def create_study_plan(query: str) -> str:
    """Creates a study plan based on the user's goals."""
    return f"Study plan created for: {query}"
