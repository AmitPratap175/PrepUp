import uuid
from sqlalchemy import Column, String, Boolean, Integer, JSON, ForeignKey, Date, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    exam_type = Column(String(50))
    is_trial_user = Column(Boolean, default=True)
    current_streak = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    settings = Column(JSON, default=dict)

class Bookmark(Base):
    __tablename__ = 'bookmarks'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    subject = Column(String(255), nullable=False)
    question_id = Column(String(255), nullable=False)
    __table_args__ = (UniqueConstraint('user_id', 'subject', 'question_id', name='_user_subject_question_uc'),)

class Word(Base):
    __tablename__ = 'words'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    word = Column(String(255), nullable=False)
    meaning = Column(Text, nullable=False)
    context = Column(Text, nullable=False)
    question_id = Column(String(255), nullable=False)
    __table_args__ = (UniqueConstraint('user_id', 'word', name='_user_word_uc'),)

class StudyDay(Base):
    __tablename__ = 'study_days'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    date = Column(Date, nullable=False, index=True)
    duration_seconds = Column(Integer, default=0)
    __table_args__ = (UniqueConstraint('user_id', 'date', name='_user_date_uc'),)
