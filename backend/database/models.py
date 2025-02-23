from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .connection import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    google_id = Column(String, unique=True)
    picture = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    exercise_sessions = relationship("ExerciseSession", back_populates="user")
    chat_history = relationship("ChatHistory", back_populates="user")

class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id = Column(Integer, primary_key=True, index=True)
    exercise_type = Column(String)
    summary = Column(Text)  # Store only the GPT-generated summary
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_email = Column(String, ForeignKey("users.email", ondelete="CASCADE"))

    # Relationship
    user = relationship("User", back_populates="exercise_sessions")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    response = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="chat_history") 