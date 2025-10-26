import re

from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

from ...settings import settings

def get_chat_model(temperature: float = 0.7):
    return ChatGoogleGenerativeAI(
        api_key = settings.GOOGLE_API_KEY,
        model=settings.TEXT_MODEL_NAME,
        temperature=temperature,
    )


def remove_asterisk_content(text: str) -> str:
    """Remove content between asterisks from the text."""
    return re.sub(r"\*.*?\*", "", text).strip()


class AsteriskRemovalParser(StrOutputParser):
    def parse(self, text):
        return remove_asterisk_content(super().parse(text))
