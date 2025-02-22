from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from langchain.chat_models import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/api")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

SYSTEM_PROMPT = """You are an expert AI Physical Therapist with extensive knowledge in rehabilitation, exercise science, and injury prevention. Your role is to:

1. Provide evidence-based advice on exercise and rehabilitation
2. Help users understand proper form and technique
3. Offer injury prevention strategies
4. Suggest appropriate exercises and stretches
5. Guide users through basic rehabilitation protocols

Important guidelines:
- Always emphasize the importance of consulting with a licensed physical therapist for personalized treatment
- Be clear about limitations and avoid making definitive medical diagnoses
- Focus on general education and best practices
- Ask clarifying questions when needed to provide better guidance
- Prioritize safety and proper form in all recommendations
- Include relevant anatomical terms but explain them in lay terms
- Provide clear, step-by-step instructions when describing exercises

Remember to maintain a professional yet approachable tone, and always prioritize user safety. Keep it concise"""

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Log the incoming request
        logger.debug(f"Received chat request with {len(request.messages)} messages")

        # Check API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OpenAI API key not found in environment variables")
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")

        # Log API key presence (don't log the actual key)
        logger.debug(f"API key found: {bool(api_key)}")

        # Initialize the ChatOpenAI model
        try:
            chat = ChatOpenAI(
                model_name="gpt-3.5-turbo",  # Changed to GPT-3.5 for testing
                temperature=0.7,
                openai_api_key=api_key,
                max_tokens=150
            )
        except Exception as e:
            logger.error(f"Error initializing ChatOpenAI: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error initializing chat model: {str(e)}")

        # Convert messages to LangChain format
        chat_messages = [SystemMessage(content=SYSTEM_PROMPT)]
        
        try:
            for msg in request.messages:
                if msg.role == "user":
                    chat_messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    chat_messages.append(AIMessage(content=msg.content))
        except Exception as e:
            logger.error(f"Error converting messages: {str(e)}")
            raise HTTPException(status_code=500, detail="Error processing messages")

        # Log the number of processed messages
        logger.debug(f"Processing {len(chat_messages)} messages")

        # Get response from the model
        try:
            response = chat(chat_messages)
            logger.debug("Successfully received response from ChatOpenAI")
            return {"message": response.content}
        except Exception as e:
            logger.error(f"Error getting response from ChatOpenAI: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error getting response from chat model: {str(e)}")

    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please check the server logs."
        )

@router.get("/test")
async def test_connection():
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"status": "error", "message": "API key not found"}
        
        # Test chat initialization
        chat = ChatOpenAI(
            model_name="gpt-3.5-turbo",
            temperature=0.7,
            openai_api_key=api_key
        )
        
        # Test simple completion
        test_message = [HumanMessage(content="Hi")]
        response = chat(test_message)
        
        return {
            "status": "success",
            "message": "Connection successful",
            "test_response": response.content
        }
    except Exception as e:
        logger.error(f"Test connection failed: {str(e)}")
        return {"status": "error", "message": str(e)} 