from langchain_core.tools import tool

@tool
def strategy_tool(query: str) -> str:
    """A placeholder tool for the StrategyAgent."""
    return f"Response from StrategyAgent for: {query}"
