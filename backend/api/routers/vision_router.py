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
from api.agent.tools import control_bulb 
from api.routers.devices_router import (
    get_all_devices, set_color, ColorControl, 
    control_device, DeviceControl, set_brightness, BrightnessControl
)
from sqlmodel import Session, select
from database.settings import engine
from database.models import Room, Device, User, GestureMapping

import logging
import cv2
import numpy as np
import asyncio
import base64
import time

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vision", tags=["Vision Analysis"])

class PresenceEvent(BaseModel):
    user: str
    status: str
    location: str = "livingroom"

class GestureEvent(BaseModel):
    gesture: str
    user: str
    location: str = "livingroom"
    timestamp: float
    duration: float


class ActionState:
    last_executions = {}

ACTION_COOLDOWN = 10.0

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
    device_status = ", ".join(device_status_list) if device_status_list else "Unknown or Offline"

    sensor_context_parts = []
    for s_id, s_data in LATEST_SENSOR_DATA.items():
        temp = s_data.get("temperature", "N/A")
        light = s_data.get("light_level", "N/A")
        sensor_context_parts.append(f"{s_id} -> Temp: {temp}°C, Light: {light}lx")
        
    sensor_context = " | ".join(sensor_context_parts) if sensor_context_parts else "All Sensors are OFFLINE or UNREACHABLE."

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
                    pass

            system_prompt = (
                f"[User: {person_name}] [System Event: User {person_name} entered at {current_time}.] \n"
                f"--- CURRENT HOME CONTEXT ---\n"
                f"Sensors: {sensor_context}\n"
                f"Devices: {device_status}\n"
                f"---------------------------\n"
                f"{time_context}\n"
                f"You are the Proactive AI Home Agent. Greet {person_name} warmly. {time_instruction} \n"
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
            f"You are the Proactive Home Agent. RULES:\n"
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
                pass

    try:
        await broadcast({"status": "processing"})
        sentence_buffer = ""

        async for chunk in chat_with_ai(user_input=system_prompt, thread_id="home_system_thread"):
            if not isinstance(chunk, str): continue
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
        logger.error(f"Agent trigger error: {e}")
        await broadcast({"status": "error", "message": "An error occurred."})
        await broadcast({"status": "stream_finished"})

async def continuous_presence_check():
    await asyncio.sleep(10) 
    logger.info("Continuous presence check active.")
    while True:
        try:
            exited_people = presence_service.check_timeouts()
            for person in exited_people:
                await trigger_agent_proactively(person, "exited")
        except Exception as e:
            pass
        await asyncio.sleep(15) 

@router.on_event("startup")
async def startup_event():
    asyncio.create_task(continuous_presence_check())

@router.post("/identify")
async def identify_face(image_file: UploadFile = File(...)):
    try:
        image_bytes = await image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        result = vision_service.recognize(frame, is_cropped=True)
        if not result["face_found"]: return {"status": "no_face"}
        
        person_name = result["name"]
        if person_name == "Unknown" or person_name is None: return {"status": "unknown_person"}
            
        return {"status": "authorized", "user": person_name, "confidence": result["confidence"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Identify Error")


@router.post("/gesture")
async def handle_gesture(event: GestureEvent, background_tasks: BackgroundTasks):
    try:
        presence_service.log_gesture(event.user, event.gesture, event.location)
        current_time = time.time()
        
        if event.duration >= 1.0:
            last_exec = ActionState.last_executions.get(f"{event.user}_{event.gesture}", 0)
            
            if current_time - last_exec > ACTION_COOLDOWN:
                with Session(engine) as session:
                    user_obj = session.exec(select(User).where(User.username == event.user)).first()
                    
                    if user_obj:
                        mapping = session.exec(select(GestureMapping).where(
                            GestureMapping.owner_id == user_obj.id,
                            GestureMapping.gesture_name == event.gesture
                        )).first()

                        if mapping:
                            target_device = session.exec(select(Device).where(Device.id == mapping.target_device_id)).first()
                            
                            if target_device:
                                logger.info(f"DYNAMIC GESTURE: '{event.user}' mapped '{event.gesture}' to '{mapping.action}' on '{target_device.display_name}'")
                                
                                device_id = target_device.name 
                                cached_devices = get_cached("all_devices", ttl=3600) or {}
                                curr_device_state = cached_devices.get(device_id, {})

                                if target_device.device_type == "bulb":
                                    if mapping.action == "turn_on":
                                        await control_device(device_id=device_id, control=DeviceControl(on=True))
                                    elif mapping.action == "turn_off":
                                        await control_device(device_id=device_id, control=DeviceControl(on=False))
                                    elif mapping.action == "brightness_up":
                                        curr_b = curr_device_state.get("brightness", 50)
                                        new_b = min(100, curr_b + 25)
                                        await set_brightness(device_id=device_id, control=BrightnessControl(brightness=new_b))
                                        cached_devices[device_id]["brightness"] = new_b
                                        set_cache("all_devices", cached_devices)
                                    elif mapping.action == "brightness_down":
                                        curr_b = curr_device_state.get("brightness", 50)
                                        new_b = max(1, curr_b - 25)
                                        await set_brightness(device_id=device_id, control=BrightnessControl(brightness=new_b))
                                        cached_devices[device_id]["brightness"] = new_b
                                        set_cache("all_devices", cached_devices)
                                        
                                elif target_device.device_type == "outlet":
                                    if mapping.action == "turn_on":
                                        await control_device(device_id=device_id, control=DeviceControl(on=True))
                                    elif mapping.action == "turn_off":
                                        await control_device(device_id=device_id, control=DeviceControl(on=False))
                                    elif mapping.action == "toggle":
                                        curr_state = curr_device_state.get("on", False)
                                        await control_device(device_id=device_id, control=DeviceControl(on=not curr_state))

                                ActionState.last_executions[f"{event.user}_{event.gesture}"] = current_time
                                return {
                                    "status": "dynamic_gesture_executed", 
                                    "device": target_device.display_name, 
                                    "action": mapping.action
                                }
                                
        return {"status": "gesture_processed", "gesture": event.gesture, "duration": event.duration}
        
    except Exception as e:
        logger.error(f"Gesture Processing Error: {e}")
        raise HTTPException(status_code=500, detail="Gesture Processing Error")

@router.post("/update_presence")
async def update_presence(event: PresenceEvent, background_tasks: BackgroundTasks):
    person_name = event.user
    location = event.location 
    status = event.status 

    if status == "camera_offline":
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
                pass
            else:
                background_tasks.add_task(trigger_agent_proactively, "Guest", "entered")
        else:
            background_tasks.add_task(trigger_agent_proactively, person_name, "entered")

    return {"status": "ok"}