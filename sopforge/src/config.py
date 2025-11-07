"""
Configuration management with environment variables and secrets.
"""

import os
from pathlib import Path
from dotenv import load_dotenv


# Load .env file
ENV_PATH = Path(__file__).parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)


class Settings:
    """Application settings from environment variables."""
    
    # API Keys
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GOOGLE_SEARCH_ENGINE_ID: str = os.getenv("GOOGLE_SEARCH_ENGINE_ID", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    LANGSMITH_API_KEY: str = os.getenv("LANGSMITH_API_KEY", "")
    
    # LangSmith (optional, for observability)
    LANGSMITH_PROJECT: str = os.getenv("LANGSMITH_PROJECT", "SOPForge-Dev")
    LANGSMITH_ENDPOINT: str = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    
    # Graph settings
    CHECKPOINTER_TYPE: str = os.getenv("CHECKPOINTER_TYPE", "memory")
    """Options: 'memory' (dev), 'postgres' (prod)"""
    
    POSTGRES_URL: str = os.getenv("POSTGRES_URL", "")
    """Only needed if CHECKPOINTER_TYPE='postgres'"""
    
    # API Server
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Debug mode
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    @classmethod
    def validate(cls) -> None:
        """Validate required settings."""
        required = ["GOOGLE_API_KEY", "GOOGLE_SEARCH_ENGINE_ID", "GEMINI_API_KEY"]
        missing = [key for key in required if not getattr(cls, key)]
        
        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}\n"
                f"See .env.example for setup instructions."
            )


settings = Settings()
