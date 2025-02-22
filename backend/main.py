from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import pose, feedback, chat

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pose.router, prefix="/pose")
app.include_router(feedback.router, prefix="/feedback")
app.include_router(chat.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to the Physiotherapy API"}

# Run using: uvicorn backend.main:app --reload
