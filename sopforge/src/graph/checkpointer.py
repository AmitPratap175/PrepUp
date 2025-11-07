"""
Checkpointer configuration for LangGraph persistence.
Handles state persistence between runs and interrupts.
"""

from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.postgres import AsyncPostgresSaver
from src.config import settings


def get_checkpointer():
    """
    Get appropriate checkpointer based on configuration.
    
    Returns:
        Checkpointer instance (MemorySaver or AsyncPostgresSaver)
    
    Raises:
        ValueError: If PostgreSQL URL is missing for production config
    """
    
    if settings.CHECKPOINTER_TYPE == "memory":
        return MemorySaver()
    
    elif settings.CHECKPOINTER_TYPE == "postgres":
        if not settings.POSTGRES_URL:
            raise ValueError(
                "POSTGRES_URL required for 'postgres' checkpointer type. "
                "Set in .env file or environment variables."
            )
        return AsyncPostgresSaver.from_conn_string(settings.POSTGRES_URL)
    
    else:
        raise ValueError(
            f"Unknown checkpointer type: {settings.CHECKPOINTER_TYPE}. "
            f"Options: 'memory', 'postgres'"
        )
