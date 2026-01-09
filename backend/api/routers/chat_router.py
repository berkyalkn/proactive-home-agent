from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.agent.graph import chat_with_ai
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Agent"])

class ChatRequest(BaseModel):
    message: str
    thread_id: str = "1"

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    try:
        response = await chat_with_ai(request.message, request.thread_id)
        return {"response": response}
    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))