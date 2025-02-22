from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from dotenv import load_dotenv
import requests as http_requests
from ...database import get_db
from ...models import User

load_dotenv()

router = APIRouter()

# Get these from Google Cloud Console
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

@router.post("/google-login")
async def google_login(code: str, db: Session = Depends(get_db)):
    try:
        # Exchange auth code for tokens
        token_endpoint = "https://oauth2.googleapis.com/token"
        data = {
            'code': code,
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'redirect_uri': 'http://localhost:3000/api/auth/callback/google',
            'grant_type': 'authorization_code'
        }
        
        response = http_requests.post(token_endpoint, data=data)
        token_data = response.json()

        if 'error' in token_data:
            raise HTTPException(
                status_code=400,
                detail=f"Token exchange failed: {token_data['error']}"
            )

        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(
            token_data['id_token'],
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Get or create user in database
        user = db.query(User).filter(User.google_id == idinfo["sub"]).first()
        if not user:
            user = User(
                email=idinfo["email"],
                name=idinfo["name"],
                picture=idinfo.get("picture", ""),
                google_id=idinfo["sub"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return {
            "status": "success",
            "user": {
                "email": user.email,
                "name": user.name,
                "picture": user.picture,
                "id": user.id
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        ) 