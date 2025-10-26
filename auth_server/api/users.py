from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from auth_server import models
from auth_server import schemas
from auth_server.core.database import get_db
from .auth import get_current_user

router = APIRouter()

@router.get("/user", response_model=schemas.User)
def read_user(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/bookmarks", response_model=List[schemas.Bookmark])
def read_bookmarks(subject: str = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if subject:
        return db.query(models.Bookmark).filter(models.Bookmark.user_id == current_user.id, models.Bookmark.subject == subject).all()
    return db.query(models.Bookmark).filter(models.Bookmark.user_id == current_user.id).all()

@router.post("/bookmarks/create", response_model=schemas.Bookmark)
def create_bookmark(bookmark: schemas.BookmarkCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_bookmark = models.Bookmark(**bookmark.dict(), user_id=current_user.id)
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    return db_bookmark

@router.delete("/bookmarks/delete/{question_id}")
def delete_bookmark(question_id: str, subject: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_bookmark = db.query(models.Bookmark).filter(models.Bookmark.user_id == current_user.id, models.Bookmark.question_id == question_id, models.Bookmark.subject == subject).first()
    if db_bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(db_bookmark)
    db.commit()
    return {"ok": True}

@router.get("/words", response_model=List[schemas.Word])
def read_words(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Word).filter(models.Word.user_id == current_user.id).all()

@router.post("/words/create", response_model=schemas.Word)
def create_word(word: schemas.WordCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_word = models.Word(**word.dict(), user_id=current_user.id)
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word

from datetime import date, timedelta

@router.delete("/words/{word_id}/delete")
def delete_word(word_id: uuid.UUID, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_word = db.query(models.Word).filter(models.Word.id == word_id, models.Word.user_id == current_user.id).first()
    if db_word is None:
        raise HTTPException(status_code=404, detail="Word not found")
    db.delete(db_word)
    db.commit()
    return {"ok": True}

@router.post("/study-heartbeat")
def study_heartbeat(heartbeat: schemas.StudyHeartbeat, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    study_day = db.query(models.StudyDay).filter(models.StudyDay.user_id == current_user.id, models.StudyDay.date == today).first()
    if study_day:
        study_day.duration_seconds += heartbeat.duration
    else:
        study_day = models.StudyDay(user_id=current_user.id, date=today, duration_seconds=heartbeat.duration)
        db.add(study_day)
    db.commit()
    return {"ok": True}

@router.get("/study-summary", response_model=schemas.StudySummary)
def study_summary(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    seven_days_ago = today - timedelta(days=6)

    today_study_day = db.query(models.StudyDay).filter(models.StudyDay.user_id == current_user.id, models.StudyDay.date == today).first()
    today_hours = today_study_day.duration_seconds / 3600 if today_study_day else 0

    week_summary_qs = db.query(models.StudyDay).filter(
        models.StudyDay.user_id == current_user.id,
        models.StudyDay.date >= seven_days_ago,
        models.StudyDay.date <= today
    ).order_by(models.StudyDay.date).all()

    summary_dict = {
        (today - timedelta(days=i)): 0
        for i in range(7)
    }
    for study_day in week_summary_qs:
        summary_dict[study_day.date] = study_day.duration_seconds / 3600

    week_summary = [
        {'date': dt.isoformat(), 'hours': hours}
        for dt, hours in summary_dict.items()
    ]
    week_summary.sort(key=lambda x: x['date'])

    return {
        'today_hours': round(today_hours, 2),
        'week_summary': week_summary
    }
