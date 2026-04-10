from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from api.services.vision_service import vision_service
from api.services.presence_service import presence_service
from api.agent.graph import chat_with_ai 
from api.services.tts_service import text_to_speech
from api.services.websocket_manager import manager
from datetime import datetime, timezone, timedelta
from api.drivers.mqtt_service import LATEST_SENSOR_DATA
from api.agent.cache import get_cached, set_cache
from api.agent.tools import HOME_INVENTORY
from api.routers.devices_router import get_all_devices

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

class GestureEvent(BaseModel):
    gesture: str
    user: str
    location: str = "living_room"
    timestamp: float


async def trigger_agent_proactively(person_name: str, event_type: str):
    logger.info(f"Agent Wakes Up: {person_name} set {event_type} to the room...")
    
    tr_timezone = timezone(timedelta(hours=3))
    now = datetime.now(tr_timezone)
    current_time = now.strftime("%H:%M")

    try:
        logger.info("Triggering real-time device scan for proactive context...")
        devices = await asyncio.wait_for(get_all_devices(), timeout=4.0)
        set_cache("all_devices", devices)
    except Exception as e:
        logger.warning(f"Real-time scan failed, using fallback cache: {e}")
        devices = get_cached("all_devices", ttl=3600) or {}

    device_status_list = [f"{v.get('name', k)} is {'ON' if v.get('on') else 'OFF'}" for k, v in devices.items()]
    for room, config in HOME_INVENTORY.items():
        for bulb_id in config.get("smart_bulbs", []):
            bulb_data = get_cached(f"bulb_{bulb_id}", ttl=3600)
            if bulb_data:
                state = "ON" if bulb_data.get("on") else "OFF"
                device_status_list.append(f"{bulb_data.get('name', bulb_id)} is {state}")
    
    device_status = ", ".join(device_status_list) if device_status_list else "Unknown or Offline"

    lr_sensors = LATEST_SENSOR_DATA.get("esp32_livingroom", {})
    if not lr_sensors:
        sensor_context = "ESP32 Livingroom Sensor is OFFLINE or UNREACHABLE."
    else:
        temp = lr_sensors.get("temperature", "Unknown")
        light = lr_sensors.get("light_level", "Unknown")
        sensor_context = f"Temperature: {temp}°C, Light Level: {light}"

    if event_type == "entered":
        if person_name in ["Guest", "Unknown", "A Stranger"]:
            system_prompt = (
                f"[System Event: An unrecognized person has just entered the room.] "
                f"Greet politely, ask for their name, and mention you don't recognize them."
            )
        else:
            last_exit_time_str = None
            for event in reversed(presence_service.history_ledger):
                if event["user"] == person_name and event["action"] == "EXITED":
                    last_exit_time_str = event["time"]
                    break
            
            time_context = ""
            time_instruction = "Give a standard warm greeting." 
            if last_exit_time_str:
                try:
                    last_exit_dt = datetime.strptime(last_exit_time_str, "%H:%M").replace(
                        year=now.year, month=now.month, day=now.day, tzinfo=tr_timezone
                    )
                    diff_minutes = (now - last_exit_dt).total_seconds() / 60
                    if diff_minutes >= 60:
                        time_context = f" The user has been away for {int(diff_minutes)} minutes (last exit at {last_exit_time_str})."
                        time_instruction = f"Mention that they've been away for a while or over an hour in a natural way."
                    else:
                        time_instruction = "The user was just here recently. DO NOT mention how long they were gone or what time they left. Just say welcome back."
                except Exception as e:
                    logger.error(f"Time calculation error: {e}")

            system_prompt = (
                f"[User: {person_name}] [System Event: User {person_name} entered at {current_time}.] \n"
                f"--- CURRENT HOME CONTEXT ---\n"
                f"Sensors: {sensor_context}\n"
                f"Devices: {device_status}\n"
                f"---------------------------\n"
                f"{time_context}\n"
                f"You are J.A.R.V.I.S, the Proactive AI Home Agent. Greet {person_name} warmly. {time_instruction} \n"
                f"CRITICAL RULES FOR LIGHTING:\n"
                f"- Analyze the 'Devices' list. If the main lights or bulbs are ALREADY 'ON', DO NOT ask to turn them on, even if the light level is low.\n"
                f"- ONLY offer to turn on the lights IF the 'Light Level' is low AND the lights are currently 'OFF'.\n"
                f"- If a device or sensor is 'Offline' or 'Unreachable', do not panic, just don't offer services related to it.\n"
                f"Keep your response natural, conversational, and strict to 2 sentences."
            )
            
    elif event_type == "camera_offline":
        system_prompt = (
            f"[System Event: Camera disconnected at {current_time}.] "
            f"IGNORE PREVIOUS MEMORY. Strictly state that the camera feed is lost and presence tracking is paused. One sentence only."
        )

    else: 
        system_prompt = (
            f"[User: {person_name}] [System Event: User {person_name} exited at {current_time}.] \n"
            f"--- CURRENT HOME CONTEXT ---\n"
            f"Sensors: {sensor_context}\n"
            f"Devices: {device_status}\n"
            f"---------------------------\n"
            f"You are J.A.R.V.I.S, the Proactive Home Agent. RULES:\n"
            f"1. Analyze the 'Devices' list. If ANY device is 'ON', you MUST turn it OFF to save energy.\n"
            f"2. Skip 'Unknown' or 'Offline' devices silently.\n"
            f"3. PERSONALITY: Explain briefly what you turned off to save energy because they left.\n"
            f"4. If all devices were ALREADY OFF, just say a polite goodbye and mention the current temperature if available.\n"
            f"Keep your response natural, conversational, and strict to 2 sentences max."
        )

    async def broadcast(message_dict: dict):
        for connection in manager.active_connections:
            try:
                await manager.send_json(message_dict, connection)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")

    try:
        await broadcast({"status": "processing"})
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
    try:
        image_bytes = await image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        result = vision_service.recognize(frame, is_cropped=True)
        
        if not result["face_found"]:
            return {"status": "no_face"}
        
        person_name = result["name"]

        if person_name == "Unknown" or person_name is None:
            return {"status": "unknown_person"}
            
        return {"status": "authorized", "user": person_name, "confidence": result["confidence"]}

    except Exception as e:
        logger.error(f"Identify Error: {e}")
        raise HTTPException(status_code=500, detail="Identify Error")


@router.post("/gesture")
async def handle_gesture(event: GestureEvent):
    try:
        presence_service.log_gesture(event.user, event.gesture, event.location)
        return {"status": "gesture_logged", "gesture": event.gesture}
    except Exception as e:
        logger.error(f"Gesture Logging Error: {e}")
        raise HTTPException(status_code=500, detail="Gesture Logging Error")


@router.post("/update_presence")
async def update_presence(event: PresenceEvent, background_tasks: BackgroundTasks):
    person_name = event.user
    location = event.location 
    status = event.status 

    if status == "camera_offline":
        logger.warning("HARDWARE EVENT: Camera connection disconnected. Physical output will not be counted.")
        presence_service.active_people.clear() 
        background_tasks.add_task(trigger_agent_proactively, "System", "camera_offline")
        return {"status": "camera_offline_handled"}

    state = presence_service.handle_detection(person_name, location)
    
    if state == "ENTRY":
        authorized_hosts = [
            name for name, data in presence_service.active_people.items() 
            if data.get("location") == location and name not in ["Unknown", "Identifying...", "A Stranger", "Guest", person_name]
        ]
        if person_name in ["Unknown", "Identifying...", "A Stranger", "Guest"]:
            if len(authorized_hosts) > 0:
                logger.info(f"Silent Protocol: The stranger entered the room, but the host ({authorized_hosts[0]}) was already inside. The agent was silenced.")
            else:
                logger.warning("SECURITY ALERT: A stranger has entered an EMPTY room!")
                background_tasks.add_task(trigger_agent_proactively, "Guest", "entered")
        else:
            logger.info(f"NEW EVENT: {person_name} entered the room! The agent is being awakened...")
            background_tasks.add_task(trigger_agent_proactively, person_name, "entered")

    return {"status": "ok"}