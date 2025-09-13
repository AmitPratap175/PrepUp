from fastapi import APIRouter, HTTPException
from typing import List

from .. import schemas
from ..storage import storage_instance

router = APIRouter()

@router.get("/", response_model=List[schemas.Course])
def read_courses():
    return storage_instance.get_courses()

@router.get("/{course_id}", response_model=schemas.Course)
def read_course(course_id: str):
    course = storage_instance.get_course(course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
