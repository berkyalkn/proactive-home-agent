from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from api.agent.graph import chat_with_ai
import logging
import os
import shutil
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

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


@router.post("/voice")
async def chat_voice_endpoint(
    file: UploadFile = File(...),
    thread_id: str = Form("1")
):
    """
    Handles voice input for the AI Agent.
    
    Process Flow:
    1. Receives an audio file (Blob/WebM) from the frontend.
    2. Temporarily saves the file to disk.
    3. Sends the file to OpenAI Whisper API for Speech-to-Text (STT).
    4. Feeds the transcribed text into the existing AI Agent.
    5. Returns both the transcription (what you said) and the AI's response.
    """
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API Key is missing in environment variables.")
    
    client = OpenAI(api_key=api_key)
    
    temp_filename = f"temp_{file.filename}"

    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with open(temp_filename, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file, 
                prompt="Homify Smart Home commands. Türkçe ve İngilizce. Vocabulary: Living Room, Salon, Bedroom, Yatak Odası, Lights, Işıklar, Turn on, Aç, Turn off, Kapat, Temperature, Sıcaklık, Red, Kırmızı, Blue, Mavi, Plug, Priz, Cam, Kamera."
            )
        
        user_text = transcription.text
        logger.info(f"STT Transcription: {user_text}")

        ai_response = await chat_with_ai(user_text, thread_id)

        os.remove(temp_filename)

        return {
            "transcription": user_text,
            "response": ai_response
        }

    except Exception as e:
        logger.error(f"Voice processing error: {str(e)}")
        
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            
        raise HTTPException(status_code=500, detail=str(e))