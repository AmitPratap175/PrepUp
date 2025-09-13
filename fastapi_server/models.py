import uuid
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Boolean,
    Integer,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    exam_type = Column(String(50))
    is_trial_user = Column(Boolean, default=True)
    current_streak = Column(Integer, default=0)
    total_score = Column(Integer, default=0)

    bookmarks = relationship("Bookmark", back_populates="user")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    question_id = Column(String(255), nullable=False)

    user = relationship("User", back_populates="bookmarks")

    __table_args__ = (
        UniqueConstraint("user_id", "subject", "question_id", name="uq_user_subject_question"),
    )
