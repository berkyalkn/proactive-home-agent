import os
import logging
from io import BytesIO
from typing import Union
import httpx

logger = logging.getLogger(__name__)

MAC_STT_URL = os.getenv("MAC_STT_URL", "http://100.98.54.6:8000/transcribe")

async def speech_to_text(audio_input: Union[str, BytesIO]) -> str:
    """
    Converts audio to text using the Local Faster-Whisper Turbo Engine on Mac.
    """
    try:
        if isinstance(audio_input, str):
            if not os.path.exists(audio_input):
                 logger.error(f"File couldn't be found: {audio_input}")
                 return ""
            file_data = open(audio_input, "rb").read()
            filename = os.path.basename(audio_input)
        
        elif isinstance(audio_input, BytesIO):
            file_data = audio_input.getvalue()
            filename = "audio.webm" 
        
        else:
            raise ValueError("Invalid audio input. Expected BytesIO or file path.")

        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {'file': (filename, file_data, 'audio/webm')}
            response = await client.post(MAC_STT_URL, files=files)
            
            if response.status_code == 200:
                transcribed_text = response.json().get("text", "")
                return transcribed_text if transcribed_text.strip() else ""
            else:
                logger.error(f"Local STT Engine Error: {response.status_code} - {response.text}")
                return ""
            
    except httpx.ConnectError:
        logger.error(f"Connection failed to Local STT at {MAC_STT_URL}.")
        return ""
    except Exception as e:
        logger.error(f"STT Process Error: {str(e)}")
        return ""