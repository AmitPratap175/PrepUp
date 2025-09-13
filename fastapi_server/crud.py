from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        exam_type=user.exam_type,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Bookmark CRUD operations
def get_bookmarks(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Bookmark).filter(models.Bookmark.user_id == user_id).offset(skip).limit(limit).all()

def create_user_bookmark(db: Session, bookmark: schemas.BookmarkCreate, user_id: int):
    db_bookmark = models.Bookmark(**bookmark.dict(), user_id=user_id)
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    return db_bookmark

def delete_bookmark(db: Session, user_id: int, question_id: str, subject: str):
    db_bookmark = db.query(models.Bookmark).filter(
        models.Bookmark.user_id == user_id,
        models.Bookmark.question_id == question_id,
        models.Bookmark.subject == subject
    ).first()
    if db_bookmark:
        db.delete(db_bookmark)
        db.commit()
        return db_bookmark
    return None
