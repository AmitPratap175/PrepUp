from pydantic import BaseModel
import uuid

class WordBase(BaseModel):
    word: str
    meaning: str
    context: str
    question_id: str

class WordCreate(WordBase):
    pass

class Word(WordBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        orm_mode = True
