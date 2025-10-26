from pydantic import BaseModel
import uuid

class BookmarkBase(BaseModel):
    subject: str
    question_id: str

class BookmarkCreate(BookmarkBase):
    pass

class Bookmark(BookmarkBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        orm_mode = True
