from typing import List, Optional
import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.requests import Request
from auth_server import schemas
from auth_server.core.storage import storage
from .auth import get_current_user
from auth_server import models
from . import chatbot_service

router = APIRouter()

@router.get("/subjects", response_model=List[str])
def get_subjects():
    return storage.get_subjects()

@router.get("/courses", response_model=List[schemas.Course])
def get_courses(examType: Optional[str] = None):
    if examType:
        return storage.get_courses_by_exam_type(examType)
    return storage.get_courses()

@router.get("/courses/{course_id}", response_model=schemas.Course)
def get_course_detail(course_id: str):
    course = storage.get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/study-materials", response_model=List[schemas.StudyMaterial])
def get_study_materials(examType: Optional[str] = None, subject: Optional[str] = None):
    if examType:
        return storage.get_study_materials_by_exam_type(examType)
    if subject:
        return storage.get_study_materials_by_subject(subject)
    return storage.get_study_materials()

@router.get("/study-materials/{material_id}", response_model=schemas.StudyMaterial)
def get_study_material_detail(material_id: str):
    material = storage.get_study_material(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found")
    return material

@router.post("/chatbot")
def chatbot_interact(
    request: Request,
    chatbot_request: schemas.ChatbotRequest,
    current_user: models.User = Depends(get_current_user)
):
    session_id = request.session.get('chatbot_session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
        request.session['chatbot_session_id'] = session_id

    token = request.headers.get("Authorization").split(" ")[1]

    reply = chatbot_service.invoke_agent(session_id=session_id, message=chatbot_request.message, token=token)
    return {"reply": reply}
