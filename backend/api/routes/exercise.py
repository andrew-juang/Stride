from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ...database.connection import get_db
from ...database.models import ExerciseSession, User
from pydantic import BaseModel
from typing import List
import logging
from collections import Counter

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

def is_meaningful_feedback(feedback: str) -> bool:
    """Check if feedback is meaningful and not just a camera/visibility message"""
    skip_phrases = [
        "try adjusting your position",
        "make sure you're visible",
        "no pose detected",
        "error processing video frame",
        "select an exercise",
        "let's make sure you're visible",
        "cannot see your full body",
        "move back from the camera",
        "move closer to the camera",
        "adjust your position",
        "camera",
        "visible"
    ]
    
    feedback_lower = feedback.lower()
    return not any(phrase in feedback_lower for phrase in skip_phrases)

def summarize_feedback(feedback: str) -> str:
    """Summarize feedback by removing duplicates, camera messages, and limiting length"""
    # Split feedback by delimiter
    feedback_points = [point.strip() for point in feedback.split('|')]
    
    # Filter out camera/visibility messages and keep only meaningful feedback
    meaningful_feedback = [
        point for point in feedback_points 
        if point and is_meaningful_feedback(point)
    ]
    
    # Remove duplicates while preserving order
    unique_feedback = []
    seen = set()
    for point in meaningful_feedback:
        if point not in seen:
            seen.add(point)
            unique_feedback.append(point)
    
    # Get the most common feedback points (limit to 3)
    if len(unique_feedback) > 3:
        # Count occurrences
        feedback_counter = Counter(meaningful_feedback)
        # Get the 3 most common feedback points
        most_common = [point for point, _ in feedback_counter.most_common(3)]
        return ' | '.join(most_common)
    
    return ' | '.join(unique_feedback) if unique_feedback else "Keep practicing!"

@router.post("/session")
async def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    try:
        # Summarize feedback before saving
        summarized_feedback = summarize_feedback(session.feedback)
        
        # Log the incoming data
        logger.info(f"Creating session for user {session.userEmail}")
        logger.info(f"Exercise type: {session.exerciseType}")
        logger.info(f"Feedback: {summarized_feedback}")

        # Create session directly
        db_session = ExerciseSession(
            exercise_type=session.exerciseType,
            feedback=summarized_feedback,  # Use summarized feedback
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
        
        # Format the response
        formatted_sessions = []
        for session in sessions:
            formatted_sessions.append({
                "exercise_type": session.exercise_type,
                "feedback": session.feedback,  # Already summarized when saved
                "created_at": session.created_at
            })
            
        return {"sessions": formatted_sessions}
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching sessions: {str(e)}") 