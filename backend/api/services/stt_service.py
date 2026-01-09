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
                prompt=(
                    "Homify Smart Home System command log. "
                    "Turn on the living room lights. Salonun ışığını aç. "
                    "What is the temperature in the bedroom? Yatak odasında sıcaklık kaç? "
                    "Set the brightness to 50 percent. Parlaklığı yüzde 50 yap. "
                    "Make the lights blue. Işıkları mavi yap. "
                    "Turn off the plug. Prizi kapat."
                )
            )
            return transcription.text
            
    except Exception as e:
        logger.error(f"STT Error: {str(e)}")
        raise e