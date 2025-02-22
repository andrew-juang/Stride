from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ...database.connection import get_db
from ...database.models import ExerciseSession, User
from pydantic import BaseModel
from typing import List
import logging

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

router = APIRouter()

class SessionCreate(BaseModel):
    exerciseType: str
    feedback: str
    userEmail: str

    class Config:
        json_schema_extra = {
            "example": {
                "exerciseType": "squat",
                "feedback": "Good form",
                "userEmail": "user@example.com"
            }
        }

@router.post("/session")
async def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    try:
        # Log the incoming data
        logger.info(f"Creating session for user {session.userEmail}")
        logger.info(f"Exercise type: {session.exerciseType}")
        logger.info(f"Feedback: {session.feedback}")

        # Create session directly
        db_session = ExerciseSession(
            exercise_type=session.exerciseType,
            feedback=session.feedback,
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
        return {"sessions": sessions}
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching sessions: {str(e)}") 