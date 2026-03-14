from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from api.services.vision_service import vision_service
from api.services.presence_service import presence_service
from api.agent.graph import chat_with_ai 
from api.services.tts_service import text_to_speech
from api.services.websocket_manager import manager

import logging
import cv2
import numpy as np
import asyncio
import base64

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vision", tags=["Vision Analysis"])

class PresenceEvent(BaseModel):
    user: str
    status: str
    location: str = "living_room"


async def trigger_agent_proactively(person_name: str, event_type: str):
    logger.info(f"Agent Wakes Up: {person_name} set {event_type} to the room...")
    
    if event_type == "entered":
        if person_name in ["Guest", "Unknown", "A Stranger"]:
            system_prompt = (
                f"[System Event: An unrecognized person has just entered the room.] "
                f"You are the Proactive AI Home Agent. Greet the person politely, mention that you don't recognize their face in your database, and kindly ask for their name. "
                f"Keep it brief (max 2 sentences). CRITICAL: Do NOT call any tools right now."
            )
        else:
            system_prompt = (
                f"[User: {person_name}] [System Event: User {person_name} has just entered the room.] "
                f"You are the Proactive AI Home Agent. Greet {person_name} warmly and briefly (max 2 sentences). "
                f"CRITICAL: Do NOT call any tools right now, just say a quick, natural welcome."
            )
            
    else: 
        system_prompt = (
            f"[User: {person_name}] [System Event: User {person_name} has just exited the room.] "
            f"You are the Proactive Home Agent. The user left the room 15 seconds ago. "
            f"Acknowledge their departure briefly (max 2 sentences) and state that you are switching to energy-saving mode. "
            f"CRITICAL: Do NOT call any tools, just give a short verbal confirmation."
        )

    async def broadcast(message_dict: dict):
        for connection in manager.active_connections:
            try:
                await manager.send_json(message_dict, connection)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")

    try:
        await broadcast({"status": "processing"})
        print(f"\n=== THE AGENT'S PROACTIVE RESPONSE ({event_type.upper()}) ===")
        sentence_buffer = ""

        async for chunk in chat_with_ai(user_input=system_prompt, thread_id="home_system_thread"):
            if not isinstance(chunk, str):
                continue
                
            print(chunk, end="", flush=True)
            sentence_buffer += chunk
            await broadcast({"status": "text_chunk", "chunk": chunk})

            if any(punct in chunk for punct in [".", "?", "!", "\n"]):
                if sentence_buffer.strip():
                    audio_bytes = await text_to_speech(sentence_buffer)
                    if audio_bytes:
                        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                        await broadcast({"status": "audio_chunk", "audio": audio_base64})
                sentence_buffer = ""

        if sentence_buffer.strip():
            audio_bytes = await text_to_speech(sentence_buffer)
            if audio_bytes:
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                await broadcast({"status": "audio_chunk", "audio": audio_base64})

        print("\n==============================\n")
        await asyncio.sleep(0.05)
        await broadcast({"status": "stream_finished"})

    except Exception as e:
        logger.error(f"An error occurred while triggering the agent: {e}")
        await broadcast({"status": "error", "message": "An error occurred."})
        await broadcast({"status": "stream_finished"})


async def continuous_presence_check():
    """It checks the room every 15-30 seconds without anyone needing to trigger it."""

    await asyncio.sleep(10) 
    logger.info("Continuous presence check active.")
    
    while True:
        try:
            exited_people = presence_service.check_timeouts()
            for person in exited_people:
                logger.info(f"TIMEOUT EVENT: {person} has not been seen. Triggering goodbye...")
                await trigger_agent_proactively(person, "exited")
        except Exception as e:
            logger.error(f"Watchdog Error: {e}")
        
        await asyncio.sleep(15) 

@router.on_event("startup")
async def startup_event():
    """When FastAPI starts, it starts the watchdog in the background."""
    asyncio.create_task(continuous_presence_check())


@router.post("/identify")
async def identify_face(image_file: UploadFile = File(...)):
    """It takes the photo from the MacBook, but only returns its name. It doesn't touch the memory or the Agent."""
    try:
        image_bytes = await image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        result = vision_service.recognize(frame)
        
        if not result["face_found"]:
            return {"status": "no_face"}
            
        person_name = result["name"]
        
        if person_name == "Unknown" or person_name is None:
            return {"status": "unknown_person"}
            
        return {"status": "authorized", "user": person_name, "confidence": result["confidence"]}

    except Exception as e:
        logger.error(f"Identify Error: {e}")
        raise HTTPException(status_code=500, detail="Identify Error")


@router.post("/update_presence")
async def update_presence(event: PresenceEvent, background_tasks: BackgroundTasks):
    """It receives 1KB of text from the MacBook 5 times per second. It manages the Shield and the Agent."""

    person_name = event.user
    location = event.location
    
    state = presence_service.handle_detection(person_name, location)
    
    if state == "ENTRY":
        if person_name == "Unknown":
            logger.warning("ALERT: A stranger has been identified!")
            background_tasks.add_task(trigger_agent_proactively, "Guest", "entered")
        else:
            logger.info(f"NEW EVENT: {person_name} ENTERED! Triggering agent...")
            background_tasks.add_task(trigger_agent_proactively, person_name, "entered")
            
    return {"status": "ok"}



