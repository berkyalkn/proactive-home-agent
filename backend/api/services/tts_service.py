import os
import logging
import asyncio

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "data", "models", "tts", "en_US-lessac-medium.onnx")

async def text_to_speech(text: str) -> bytes:
    """
    Uses the Piper TTS model to convert text to speech.
    """

    safe_text = text.strip()
    if not safe_text:
        return None
        
    if not safe_text.endswith((".", "!", "?")):
        safe_text += "."

    try:
        logger.info(f"Piper synthesizes (CLI Subprocess): '{safe_text}'")

        process = await asyncio.create_subprocess_exec(
            "piper", 
            "--model", MODEL_PATH,
            "--output_file", "-",  
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout_data, stderr_data = await process.communicate(input=safe_text.encode())

        if process.returncode != 0:
            logger.error(f"Piper CLI Error: {stderr_data.decode()}")
            return None

        if stdout_data:
            logger.info(f"Piper Generated the Sound! Actual WAV Size: {len(stdout_data)} bytes.")
            return stdout_data
        else:
            logger.error("Piper worked but couldn't produce any sound (0 bytes).")
            return None
            
    except Exception as e:
        logger.error(f"Local TTS Generation Error (Subprocess): {str(e)}")
        return None