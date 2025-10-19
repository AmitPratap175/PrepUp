from langchain_core.tools import tool

@tool
def find_study_materials(query: str) -> str:
    """Finds study materials based on the user's query."""
    return f"Study materials found for: {query}"
