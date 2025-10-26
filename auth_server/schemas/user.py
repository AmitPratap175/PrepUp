from pydantic import BaseModel, EmailStr
import uuid

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    exam_type: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: EmailStr | None = None

class User(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    exam_type: str
    is_trial_user: bool
    current_streak: int
    total_score: int
    settings: dict

    class Config:
        orm_mode = True
