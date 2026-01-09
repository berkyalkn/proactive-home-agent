from openai import AsyncOpenAI
import os
import logging

logger = logging.getLogger(__name__)

# Async Client başlatıyoruz
api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=api_key) if api_key else None

async def text_to_speech(text: str) -> bytes:
    """
    OpenAI uses the TTS-1 model to convert text to speech.
    """
    if not client:
        logger.error("OpenAI API Key missing")
        return None

    safe_text = text.strip()
    if not safe_text.endswith((".", "!", "?")):
        safe_text += "."

    try:
        response = await client.audio.speech.create(
            model="tts-1",  
            voice="nova",
            input=safe_text
        )
        return response.content
        
    except Exception as e:
        logger.error(f"TTS Error: {str(e)}")
        return None