from pydantic import BaseModel
from datetime import date

class StudyHeartbeat(BaseModel):
    duration: int

class StudyDaySummary(BaseModel):
    date: date
    hours: float

class StudySummary(BaseModel):
    today_hours: float
    week_summary: list[StudyDaySummary]
