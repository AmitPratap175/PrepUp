from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class Subject(BaseModel):
    name: str

class Course(BaseModel):
    id: str
    title: str
    description: str
    examType: str
    duration: str
    price: int
    originalPrice: int
    features: List[str]
    imageUrl: HttpUrl
    isPopular: bool

class StudyMaterial(BaseModel):
    id: str
    title: str
    description: str
    examType: str
    subject: str
    type: str
    pages: int
    rating: int
    reviewCount: int
    isPremium: bool
    downloadUrl: Optional[HttpUrl]
    imageUrl: HttpUrl
