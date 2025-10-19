from langchain_core.tools import tool

@tool
def vocabulary_tool(query: str) -> str:
    """A placeholder tool for the VocabularyAgent."""
    return f"Response from VocabularyAgent for: {query}"
