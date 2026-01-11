from openai import AsyncOpenAI
import os
import logging

logger = logging.getLogger(__name__)

api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=api_key) if api_key else None

async def speech_to_text(file_path: str) -> str:
    """
    Converts the given audio file to text using OpenAI Whisper.
    """
    if not client:
        logger.error("OpenAI API Key missing for STT")
        return ""

    try:
        with open(file_path, "rb") as audio_file:
            transcription = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file, 
                temperature=0.0,
                language="en", 
                prompt=(
                    "Smart Home Command Log. "
                    "Turn off the oven. Turn on the desk lamp. "
                    "Turn on the living room light. "
                    "Set brightness to 20 and set color to red. "
                    "What is the temperature? "
                    "Homify System."
                )
            )
            return transcription.text
            
    except Exception as e:
        logger.error(f"STT Error: {str(e)}")
        raise e