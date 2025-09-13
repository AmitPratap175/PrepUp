import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional, List

# Bookmark Schemas
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

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    exam_type: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: uuid.UUID
    is_trial_user: bool
    current_streak: int
    total_score: int
    bookmarks: List[Bookmark] = []

    class Config:
        orm_mode = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Question Schemas
class QuestionOption(BaseModel):
    data_option: str
    label: str
    option_text: str
    is_correct: bool

class Question(BaseModel):
    qid: str
    passage_text: Optional[str] = None
    question_text: str
    options: List[QuestionOption]
    correct_option_data: str
    solution_text: Optional[str] = None
    full_markdown: str
    image_url: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None

# Test Schemas
class PracticeTest(BaseModel):
    id: str
    title: str
    examType: str
    subject: str
    duration: int
    totalQuestions: int
    questions: List[Question]

# Course Schemas
class Course(BaseModel):
    id: str
    title: str
    description: str
    examType: str
    duration: str
    price: int
    originalPrice: Optional[int] = None
    features: List[str]
    imageUrl: Optional[str] = None
    isPopular: Optional[bool] = None

# Study Material Schemas
class StudyMaterial(BaseModel):
    id: str
    title: str
    description: str
    examType: str
    subject: str
    type: str
    pages: Optional[int] = None
    rating: Optional[int] = None
    reviewCount: Optional[int] = None
    isPremium: Optional[bool] = None
    downloadUrl: Optional[str] = None
    imageUrl: Optional[str] = None
