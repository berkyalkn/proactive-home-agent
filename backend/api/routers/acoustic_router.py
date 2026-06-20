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


async def ask_and_wait_for_glass(confidence: float, settings: SecuritySettings):
    """Speech-to-listen verification engine for glass breakage."""

    logger.critical("GLASS BREAK DETECTED! Initiating verification window...")

    with Session(engine) as session:
        new_log = SystemLog(
            level="WARNING",
            source="Acoustic_Sensor",
            message=f"GLASS BREAK DETECTED (Confidence {confidence:.0%}). Waiting for user verification."
            )
        session.add(new_log)
        session.commit()

    AcousticState.active_tasks["system_glass"] = "PENDING"

    question = "Warning. I heard a glass breaking sound. Are you okay? Please say 'I am fine' to cancel the security protocol."
    
    try:
        await broadcast({"status": "processing"})
        await asyncio.sleep(0.2)
        await broadcast({"status": "text_chunk", "chunk": question})

        audio_bytes = await text_to_speech(question)
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            await broadcast({"status": "audio_chunk", "audio": audio_base64})
            
        await broadcast({"status": "stream_finished"})
        
        logger.info("Waiting for AI to finish speaking before opening microphone...")
        await asyncio.sleep(8.0) 
        await broadcast({"status": "force_mic_open", "duration": 10})
    except: pass

    for _ in range(15):
        await asyncio.sleep(1.0)
        if AcousticState.active_tasks.get("system_glass") == "CANCELLED":
            logger.info("GLASS BREAK EMERGENCY ABORTED BY USER.")
            AcousticState.active_tasks.pop("system_glass", None)
            try:
                ack_msg = "Alarm cancelled. I am glad everything is okay."
                await broadcast({"status": "processing"})
                await asyncio.sleep(0.2)
                await broadcast({"status": "text_chunk", "chunk": ack_msg})
                
                audio_bytes = await text_to_speech(ack_msg)
                if audio_bytes:
                    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
                    await broadcast({"status": "audio_chunk", "audio": audio_b64})
                await broadcast({"status": "stream_finished"})
            except: pass
            return

    logger.critical("NO RESPONSE TO GLASS BREAK! EXECUTING EMERGENCY LOCKDOWN!")

    with Session(engine) as session:
        new_log = SystemLog(
            level="CRITICAL",
            source="Acoustic_Sensor",
            message=f"GLASS BREAK EMERGENCY: System detected glass breakage (Confidence {confidence:.0%}) and received no response. Lockdown initiated."
            )
        session.add(new_log)
        session.commit()

    AcousticState.active_tasks.pop("system_glass", None)
    await execute_emergency_lockdown("System (Audio Sensor)", settings)


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