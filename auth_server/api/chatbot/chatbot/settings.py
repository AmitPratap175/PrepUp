from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from pathlib import Path

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", env_file_encoding="utf-8")

    GOOGLE_API_KEY: str =  "AIzaSyDOmG_gjhPO4ZxWzhF5r_2I5x7XWnLsnUw"

    INFO_DB_PATH: str = str(Path(__file__).parent/'info.db')

    # Email Configuration
    FROM_EMAIL: str = "00amitpratap@gmail.com"
    COMPANY_NAME: str = "PrepUp"
    SUPPORT_EMAIL: str = "00amitpratap@gmail.com"
    SUPPORT_PHONE: str = "+91-6370698003"


    TEXT_MODEL_NAME: str = "gemini-2.0-flash"
    SMALL_TEXT_MODEL_NAME: str = "gemma2-9b-it"
    STT_MODEL_NAME: str = "gemini-2.0-flash"
    TTS_MODEL_NAME: str = "gemini-2.5-flash-preview-tts"
    ITT_MODEL_NAME: str = "gemini-2.0-flash"
    TTI_MODEL_NAME: str = "models/gemini-2.0-flash-exp-image-generation"

    MEMORY_TOP_K: int = 3
    RAG_TOP_K: int = 3
    ROUTER_MESSAGES_TO_ANALYZE: int = 3
    TOTAL_MESSAGES_SUMMARY_TRIGGER: int = 20
    TOTAL_MESSAGES_AFTER_SUMMARY: int = 5

    SHORT_TERM_MEMORY_DB_PATH: str = "memory.db"


settings = Settings()
