from pydantic import BaseModel

class ChatbotRequest(BaseModel):
    message: str
