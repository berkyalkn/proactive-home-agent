from openai import AsyncOpenAI
import os
import logging
from io import BytesIO
from typing import Union

logger = logging.getLogger(__name__)

api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=api_key) if api_key else None

async def speech_to_text(audio_input: Union[str, BytesIO]) -> str:
    """
    Converts the given audio file to text using OpenAI Whisper.
    """
    if not client:
        logger.error("OpenAI API Key missing for STT")
        return ""

    try:
        if isinstance(audio_input, BytesIO):
            audio_file = audio_input
            audio_file.name = "audio.webm" 
        
        elif isinstance(audio_input, str):
            if not os.path.exists(audio_input):
                 logger.error(f"File couldn't found: {audio_input}")
                 return ""
            audio_file = open(audio_input, "rb")
        
        else:
            raise ValueError("Invalid audio input. Expected BytesIO or file path.")

        transcription = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file, 
                temperature=0.0,
                language="en", 
                prompt=(
                    "A regular smart home conversation. "
                    "Commands like 'turn on', 'turn off', or simple answers like 'I am fine', 'okay', 'cancel'. "
                    "If it's silent, just output nothing."
)
        )
        
        if isinstance(audio_input, str):
            audio_file.close()

        return transcription.text
            
    except Exception as e:
        logger.error(f"STT Error: {str(e)}")
        if isinstance(audio_input, str) and 'audio_file' in locals() and not audio_file.closed:
            audio_file.close()
        raise e