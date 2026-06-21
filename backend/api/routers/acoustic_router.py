from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
import asyncio
import logging
import time
import base64

from sqlmodel import Session, select
from database.settings import engine
from database.models import SecuritySettings, SystemLog

from api.services.tts_service import text_to_speech
from api.services.websocket_manager import manager
from api.routers.vision_router import execute_emergency_lockdown

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/acoustic", tags=["Acoustic Analysis"])

class VoiceCancelEvent(BaseModel):
    transcript: str

class AcousticState:
    active_tasks = {}

async def broadcast(message_dict: dict):
    for connection in manager.active_connections:
        try: await manager.send_json(message_dict, connection)
        except Exception: pass


@router.post("/cancel_alarm")
async def cancel_acoustic_alarm(event: VoiceCancelEvent):
    """An endpoint that cancels acoustic alarms via voice command."""

    text = event.transcript.lower()
    cancel_keywords = ["fine", "okay", "ok", "im good", "i am good", "safe", "cancel", "don't worry"]
    
    if any(word in text for word in cancel_keywords):
        if AcousticState.active_tasks.get("system_glass") == "PENDING":
            logger.info(f"VOICE INTERCEPT: Heard '{text}'. Cancelling Glass Break Alarm!")
            AcousticState.active_tasks["system_glass"] = "CANCELLED"
            
            with Session(engine) as session:
                new_log = SystemLog(
                    level="WARNING",
                    source="Voice_Intercept",
                    message=f"FALSE ALARM AVERTED: System heard glass breaking, but user confirmed safety."
                )
                session.add(new_log)
                session.commit()
            
            return {"status": "cancelled", "message": "Acoustic alarm aborted via voice."}
            
    return {"status": "ignored", "message": "No active acoustic alarm or keyword match."}


async def announce_glass_break(confidence: float):
    """Information announcement for glass breakage."""

    logger.info("Announcing Glass Break...")

    with Session(engine) as session:
        new_log = SystemLog(
            level="WARNING", 
            source="Acoustic_Sensor",
            message=f"Glass break detected (Confidence {confidence:.0%})."
        )
        session.add(new_log)
        session.commit()

    announcement = "Attention. A glass breaking sound has been detected in the home."
    
    try:
        await broadcast({"status": "processing"})
        await asyncio.sleep(0.2)
        await broadcast({"status": "text_chunk", "chunk": announcement})

        audio_bytes = await text_to_speech(announcement)
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            await broadcast({"status": "audio_chunk", "audio": audio_base64})
            
        await broadcast({"status": "stream_finished"})
    except Exception as e:
        logger.error(f"Glass break announcement error: {e}")

async def announce_baby_cry(confidence: float):
    """Information announcement for baby crying."""

    logger.info("Announcing Baby Cry...")

    with Session(engine) as session:
        new_log = SystemLog(
            level="INFO",
            source="Acoustic_Sensor",
            message=f"Baby crying detected (Confidence {confidence:.0%})."
        )
        session.add(new_log)
        session.commit()

    announcement = "Attention. A baby crying sound has been detected in the room."
    
    try:
        await broadcast({"status": "processing"})
        await asyncio.sleep(0.2)
        await broadcast({"status": "text_chunk", "chunk": announcement})

        audio_bytes = await text_to_speech(announcement)
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            await broadcast({"status": "audio_chunk", "audio": audio_base64})
            
        await broadcast({"status": "stream_finished"})
    except Exception as e:
        logger.error(f"Baby cry announcement error: {e}")