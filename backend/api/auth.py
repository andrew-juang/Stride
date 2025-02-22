from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
import os
from dotenv import load_dotenv
from ..database.connection import get_db
from ..database.models import User
from ..database.logger import logger
from pydantic import BaseModel
from typing import Optional
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Get these from Google Cloud Console
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Add this class for request validation
class GoogleLoginRequest(BaseModel):
    code: str
    redirect_uri: str

class GoogleUser(BaseModel):
    email: str
    name: str
    google_id: str
    picture: Optional[str] = None

@router.post("/google-login")
async def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        logger.info("=== Starting Google login process ===")
        logger.info(f"Received code (first 10 chars): {request.code[:10]}...")
        logger.info(f"Using redirect URI: {request.redirect_uri}")
        logger.info(f"Client ID: {GOOGLE_CLIENT_ID[:10]}...")
        
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            logger.error("Missing Google OAuth credentials")
            raise HTTPException(
                status_code=500,
                detail="Server configuration error: Missing OAuth credentials"
            )

        # Exchange code for tokens
        token_endpoint = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": request.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": request.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        logger.info("Token exchange request data:")
        logger.info(f"Token endpoint: {token_endpoint}")
        logger.info(f"Redirect URI being sent: {token_data['redirect_uri']}")
        logger.info(f"Client ID being used: {token_data['client_id'][:10]}...")
        
        token_response = requests.post(token_endpoint, data=token_data)
        logger.info(f"Token exchange response status: {token_response.status_code}")
        logger.info(f"Token exchange response: {token_response.text}")
        
        if not token_response.ok:
            error_data = token_response.json() if token_response.text else {}
            error_msg = error_data.get('error_description', error_data.get('error', 'Unknown error'))
            logger.error(f"Token exchange failed: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=f"Token exchange failed: {error_msg}"
            )

        tokens = token_response.json()
        logger.info("Successfully received tokens")
        
        # Get user info from Google
        userinfo_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        userinfo_response = requests.get(userinfo_endpoint, headers=headers)
        
        if not userinfo_response.ok:
            logger.error(f"Failed to get user info: {userinfo_response.text}")
            raise HTTPException(
                status_code=400,
                detail="Failed to get user info from Google"
            )
            
        user_info = userinfo_response.json()
        logger.info(f"Received user info for: {user_info.get('email')}")
        
        try:
            # Check if user exists in database
            db_user = db.query(User).filter(User.email == user_info["email"]).first()
            
            if db_user:
                logger.info(f"Existing user found: {db_user.email}")
                db_user.name = user_info["name"]
                db_user.picture = user_info.get("picture")
            else:
                logger.info(f"Creating new user: {user_info['email']}")
                db_user = User(
                    email=user_info["email"],
                    name=user_info["name"],
                    picture=user_info.get("picture")
                )
                db.add(db_user)
                
            db.commit()
            logger.info("Database updated successfully")
            
            return {
                "email": db_user.email,
                "name": db_user.name,
                "picture": db_user.picture
            }
        except SQLAlchemyError as e:
            logger.error(f"Database error: {str(e)}")
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Database error occurred"
            )
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )