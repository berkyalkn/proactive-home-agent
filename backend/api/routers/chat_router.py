from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from api.agent.graph import chat_with_ai
import logging
import os
import shutil
import base64
from api.services.tts_service import text_to_speech
from api.services.stt_service import speech_to_text
from openai import AsyncOpenAI 
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Agent"])

api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=api_key)

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


@router.post("/voice")
async def chat_voice_endpoint(
    file: UploadFile = File(...),
    thread_id: str = Form("1")
):
    temp_filename = f"temp_{file.filename}"

    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        user_text = await speech_to_text(temp_filename)
        logger.info(f"STT Transcription: {user_text}")

        ai_response = await chat_with_ai(user_text, thread_id)

        audio_base64 = None
        try:
            audio_bytes = await text_to_speech(ai_response)
            if audio_bytes:
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")

        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        return {
            "transcription": user_text,
            "response": ai_response,
            "audio": audio_base64 
        }

    except Exception as e:
        logger.error(f"Voice processing error: {str(e)}")
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(status_code=500, detail=str(e))