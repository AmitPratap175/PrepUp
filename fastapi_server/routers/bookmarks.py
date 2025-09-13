from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Bookmark])
def read_bookmarks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    bookmarks = crud.get_bookmarks(db, user_id=current_user.id, skip=skip, limit=limit)
    return bookmarks

@router.post("/create", response_model=schemas.Bookmark)
def create_bookmark(
    bookmark: schemas.BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_user_bookmark(db=db, bookmark=bookmark, user_id=current_user.id)

@router.delete("/delete/{question_id}")
def delete_bookmark(
    question_id: str,
    subject: str, # subject should be a query parameter as in the original django app
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deleted_bookmark = crud.delete_bookmark(db, user_id=current_user.id, question_id=question_id, subject=subject)
    if deleted_bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"ok": True}
