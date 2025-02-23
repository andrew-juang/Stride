from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...database.connection import get_db
from ...database.models import ExerciseSession, User
from pydantic import BaseModel
from typing import List
import logging
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

class SessionCreate(BaseModel):
    exerciseType: str
    feedback: List[str]  # List of feedback messages
    userEmail: str

    class Config:
        json_schema_extra = {
            "example": {
                "exerciseType": "squat",
                "feedback": ["Good form", "Keep practicing"],
                "userEmail": "user@example.com"
            }
        }

def generate_session_summary(exercise_type: str, feedback_list: List[str]) -> str:
    """Generate a summary of the exercise session using ChatGPT"""
    try:
        feedback_text = "\n".join(feedback_list)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful physical therapy assistant. Summarize the exercise session feedback in 1-2 encouraging sentences."
                },
                {
                    "role": "user",
                    "content": f"Exercise: {exercise_type}\nFeedback received during session:\n{feedback_text}\n\nPlease provide a brief 1-2 sentence encouraging summary of how this exercise session went."
                }
            ],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        return "Session completed. Keep practicing to improve your form!"

router = APIRouter()

@router.post("/session")
async def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    try:
        # Generate summary using ChatGPT
        summary = generate_session_summary(session.exerciseType, session.feedback)
        
        # Create session with GPT-generated summary
        db_session = ExerciseSession(
            exercise_type=session.exerciseType,
            summary=summary,
            user_email=session.userEmail
        )
        
        db.add(db_session)
        db.commit()
        
        return {"message": "Session recorded successfully"}
        
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent-sessions/{user_email}")
async def get_recent_sessions(user_email: str, db: Session = Depends(get_db)):
    try:
        logger.info(f"Fetching recent sessions for user: {user_email}")
        
        # First verify the user exists
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            logger.error(f"User not found: {user_email}")
            raise HTTPException(status_code=404, detail="User not found")
            
        sessions = db.query(ExerciseSession)\
            .filter(ExerciseSession.user_email == user_email)\
            .order_by(ExerciseSession.created_at.desc())\
            .limit(5)\
            .all()
            
        logger.info(f"Found {len(sessions)} sessions")
        
        return {
            "sessions": [{
                "exercise_type": session.exercise_type,
                "summary": session.summary,
                "created_at": session.created_at
            } for session in sessions]
        }
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching sessions: {str(e)}") 