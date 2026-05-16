from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel
from api.services.vision_service import vision_service
from api.services.presence_service import presence_service
from api.agent.graph import chat_with_ai 
from api.services.tts_service import text_to_speech
from api.services.websocket_manager import manager
from api.services.notification_service import notifier
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
from database.models import Room, Device, User, GestureMapping, SecuritySettings

import logging
import cv2
import numpy as np
import asyncio
from typing import Optional
import base64
import time
import os

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

class VoiceCancelEvent(BaseModel):
    transcript: str

class ActionState:
    last_executions = {}
    active_sos_tasks = {} 
    last_emergency_time = 0.0  
    last_greeting_times = {} 

ACTION_COOLDOWN = 10.0

async def trigger_agent_proactively(person_name: str, event_type: str):

    if event_type not in ["fall_detected"]:
        if time.time() - getattr(ActionState, 'last_emergency_time', 0) < 120:
            logger.info(f"Agent Muted: Skipping '{event_type}' chat because an emergency protocol was active recently.")
            return

    if event_type == "camera_offline":
        logger.info("Camera offline event received. Muting the audible announcement.")
        return 

    if event_type == "entered" and person_name not in ["Guest", "Unknown", "A Stranger"]:
        last_greeted = getattr(ActionState, 'last_greeting_times', {}).get(person_name, 0)
        if time.time() - last_greeted < 900: 
            logger.info(f"ANTI-SPAM: {person_name} was already greeted recently. Suppressing spam.")
            return
        else:
            ActionState.last_greeting_times[person_name] = time.time()

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
                    
                    time_context = f"[Secret Context: The user left at {last_exit_time_str} and has been away for {int(diff_minutes)} minutes.]"
                    
                    if diff_minutes >= 60:
                        hours_away = int(diff_minutes / 60)
                        time_instruction = f"Mention that they've been away for a while (e.g., over {hours_away} hours) in a natural, warm way."
                    else:
                        time_instruction = "Give a standard warm welcome back. You know how long they were gone, but you don't need to specify the exact minutes."
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
        await broadcast({"status": "stream_finished"})


@router.post("/cancel_fall_alarm")
async def cancel_fall_alarm(event: VoiceCancelEvent):
    """Endpoint that cancels the audible fall alarm."""

    text = event.transcript.lower()
    cancel_keywords = ["fine", "okay", "ok", "im good", "i am good", "safe", "cancel", "don't worry"]
    
    if any(word in text for word in cancel_keywords):
        if ActionState.active_sos_tasks.get("system_fall") == "PENDING":
            logger.info(f"VOICE INTERCEPT: Heard '{text}'. Cancelling Fall Alarm!")
            ActionState.active_sos_tasks["system_fall"] = "CANCELLED"
            return {"status": "cancelled", "message": "Fall alarm aborted via voice."}
    
    return {"status": "ignored", "message": "No cancellation keywords detected or no active alarm."}

async def ask_and_wait_for_fall(confidence: float, screenshot_bytes: Optional[bytes]):
    """Ten-second listening and verification engine after the fall."""

    logger.critical("FALL DETECTED! Initiating verification window...")
    ActionState.last_emergency_time = time.time()
    ActionState.active_sos_tasks["system_fall"] = "PENDING"

    with Session(engine) as session:
        settings = session.exec(select(SecuritySettings)).first()

    if not settings or not settings.is_active or not getattr(settings, 'use_fall_detection', True):
        return

    question = "Attention. The camera has detected a fall. Are you okay? Please say 'I am fine' or show your cancel gesture to abort the alarm."
    
    async def broadcast(message_dict: dict):
        for connection in manager.active_connections:
            try:
                await manager.send_json(message_dict, connection)
            except Exception: pass

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
        if ActionState.active_sos_tasks.get("system_fall") == "CANCELLED":
            logger.info("FALL EMERGENCY ABORTED BY USER.")
            ActionState.active_sos_tasks.pop("system_fall", None)
            try:
                ack_msg = "Alarm cancelled. I am glad you are safe."
                
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

    logger.critical("NO RESPONSE! EXECUTING FALL EMERGENCY LOCKDOWN!")
    ActionState.active_sos_tasks.pop("system_fall", None)
    await execute_fall_emergency_lockdown(confidence, screenshot_bytes, settings)


async def execute_fall_emergency_lockdown(confidence: float, screenshot_bytes: Optional[bytes], settings: SecuritySettings):
    """Function that sends an SMS/Call if no response is received within 10 seconds."""

    ActionState.last_emergency_time = time.time()

    target_phone = settings.emergency_phone
    target_name = settings.emergency_contact_name

    alert_text = (
        f"⚠️ *FALL DETECTED*\n\n"
        f"The home camera system detected a fall and received NO RESPONSE from the user.\n"
        f"Confidence: {confidence:.0%}\n"
        f"Please check immediately."
    )

    tts_voice = (
        "No response received. The smart home camera system has initiated the fall emergency protocol. "
        f"{target_name}, please check the situation immediately."
    )

    if settings.use_telegram:
        if screenshot_bytes:
            asyncio.create_task(notifier.send_telegram_photo(screenshot_bytes, alert_text))
        else:
            asyncio.create_task(notifier.send_telegram_alert(alert_text))

    if settings.use_sms and target_phone:
        sms_text = f"FALL DETECTED. NO RESPONSE from user (confidence: {confidence:.0%}). Please check immediately."
        asyncio.create_task(notifier.send_sms(target_phone, sms_text))

    if settings.use_voice_call and target_phone:
        asyncio.create_task(notifier.make_voice_call(target_phone, tts_voice))

    async def broadcast(message_dict: dict):
        for connection in manager.active_connections:
            try:
                await manager.send_json(message_dict, connection)
            except Exception: pass

    try:
        final_msg = "No response received. Emergency contacts and authorities have been notified. Help is on the way."
        
        await broadcast({"status": "processing"})
        await asyncio.sleep(0.2) 
        await broadcast({"status": "text_chunk", "chunk": final_msg})

        audio_bytes = await text_to_speech(final_msg)
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            await broadcast({"status": "audio_chunk", "audio": audio_base64})
                
        await broadcast({"status": "stream_finished"})
    except Exception as e:
        logger.error(f"Final Fall TTS error: {e}")


@router.post("/fall_alert")
async def handle_fall_alert(request: Request, background_tasks: BackgroundTasks):
    """The main endpoint that receives the fall warning from the camera."""

    content_type = request.headers.get("content-type", "")
    screenshot_bytes = None

    if "multipart" in content_type:
        form = await request.form()
        confidence = float(form["confidence"])
        timestamp = float(form["timestamp"])
        source = form.get("source", "mac_camera")
        screenshot_file = form.get("screenshot")
        if screenshot_file:
            screenshot_bytes = await screenshot_file.read()
    else:
        body = await request.json()
        confidence = body["confidence"]
        timestamp = body["timestamp"]
        source = body.get("source", "mac_camera")

    logger.critical(f"FALL ALERT RECEIVED — confidence: {confidence:.0%}, source: {source}")
    presence_service.log_fall_event("living_room", confidence)
    
    background_tasks.add_task(ask_and_wait_for_fall, confidence, screenshot_bytes)

    return {"status": "fall_alert_received"}


async def delayed_emergency_lockdown(person_name: str, settings: SecuritySettings):
    """Wait 5 seconds after giving a manual SOS (hand gesture)."""

    logger.info(f"SOS GRACE PERIOD STARTED: {person_name} has 5 seconds to cancel...")
    
    try:
        with Session(engine) as session:
            bulbs = session.exec(select(Device).where(Device.device_type == "bulb")).all()
            for bulb in bulbs:
                try: await asyncio.wait_for(set_color(device_id=bulb.name, control=ColorControl(hue=0, saturation=100)), timeout=1.0)
                except Exception: pass

        await asyncio.sleep(1.0)
        
        with Session(engine) as session:
            bulbs = session.exec(select(Device).where(Device.device_type == "bulb")).all()
            for bulb in bulbs:
                try: await asyncio.wait_for(set_color(device_id=bulb.name, control=ColorControl(hue=0, saturation=0)), timeout=1.0)
                except Exception: pass
    except Exception as e:
        logger.error(f"Silent Acknowledge error: {e}")

    await asyncio.sleep(4.0)
    
    if ActionState.active_sos_tasks.get(person_name) == "CANCELLED":
        logger.info(f"SOS ABORTED: {person_name} successfully cancelled the alarm during grace period.")
        ActionState.active_sos_tasks.pop(person_name, None)
        return 
        
    logger.critical(f"GRACE PERIOD EXPIRED! EXECUTING LOCKDOWN FOR {person_name}!")
    ActionState.active_sos_tasks.pop(person_name, None)
    await execute_emergency_lockdown(person_name, settings)


async def execute_emergency_lockdown(person_name: str, settings: SecuritySettings):
    logger.warning(f"EMERGENCY LOCKDOWN INITIATED BY {person_name}")
    ActionState.last_emergency_time = time.time()  
    
    async def flash_lights_dynamic():
        try:
            with Session(engine) as session:
                bulbs = session.exec(select(Device).where(Device.device_type == "bulb")).all()
                if not bulbs: return
                
                loop_count = getattr(settings, 'emergency_duration', 10) // 2 
                color_setting = getattr(settings, 'emergency_light_color', 'red')
                
                for i in range(loop_count):
                    for bulb in bulbs:
                        if color_setting == "blue": target_hue = 240
                        elif color_setting == "police": target_hue = 0 if i % 2 == 0 else 240
                        else: target_hue = 0
                            
                        try:
                            await asyncio.wait_for(set_color(device_id=bulb.name, control=ColorControl(hue=target_hue, saturation=100)), timeout=1.0)
                            await asyncio.wait_for(set_brightness(device_id=bulb.name, control=BrightnessControl(brightness=100)), timeout=1.0)
                        except Exception: pass
                        
                    await asyncio.sleep(1.0)
                    for bulb in bulbs:
                        try: await asyncio.wait_for(control_device(device_id=bulb.name, control=DeviceControl(on=False)), timeout=1.0)
                        except: pass
                    
                    await asyncio.sleep(1.0)
                
                for bulb in bulbs:
                    try:
                        await asyncio.wait_for(control_device(device_id=bulb.name, control=DeviceControl(on=True)), timeout=1.0)
                        await asyncio.wait_for(set_color(device_id=bulb.name, control=ColorControl(hue=0, saturation=0)), timeout=1.0)
                    except: pass
        except Exception as e:
            logger.error(f"Lockdown lights failed: {e}")

    asyncio.create_task(flash_lights_dynamic())

    target_phone = settings.emergency_phone
    target_name = settings.emergency_contact_name

    alert_sms = f"EMERGENCY: {person_name} has triggered an SOS alarm in their smart home system. Please check the situation or contact us immediately!"
    
    if settings.use_telegram:
        asyncio.create_task(notifier.send_telegram_alert(f"*EMERGENCY ALERT* \n\n*Reporter:* {person_name}\n*Status:* Home security protocol manually triggered!"))
    if settings.use_sms and target_phone:
        asyncio.create_task(notifier.send_sms(target_phone, alert_sms))
    if settings.use_voice_call and target_phone:
        asyncio.create_task(notifier.make_voice_call(target_phone, f"Attention. An emergency alarm has been triggered by {person_name}."))

    async def broadcast(message_dict: dict):
        for connection in manager.active_connections:
            try:
                await manager.send_json(message_dict, connection)
            except Exception: pass

    try:
        announcement = getattr(settings, 'emergency_action_text', 'Security protocol activated.')
        
        await broadcast({"status": "processing"})
        await asyncio.sleep(0.2) 
        await broadcast({"status": "text_chunk", "chunk": announcement})

        audio_bytes = await text_to_speech(announcement)
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            await broadcast({"status": "audio_chunk", "audio": audio_base64})
                
        await broadcast({"status": "stream_finished"})
    except: pass


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
                        security_config = session.exec(select(SecuritySettings).where(SecuritySettings.owner_id == user_obj.id)).first()

                        if security_config:
                            if getattr(security_config, 'emergency_cancel_gesture', "Open_Palm") == event.gesture:
                                if event.duration >= 2.0:
                                    cancelled = False
                                    if ActionState.active_sos_tasks.get(event.user) == "PENDING":
                                        ActionState.active_sos_tasks[event.user] = "CANCELLED"
                                        cancelled = True
                                    if ActionState.active_sos_tasks.get("system_fall") == "PENDING":
                                        ActionState.active_sos_tasks["system_fall"] = "CANCELLED"
                                        cancelled = True
                                        
                                    if cancelled:
                                        return {"status": "sos_cancelled_successfully"}

                            if security_config.emergency_gesture == event.gesture:
                                if event.duration >= 4.0:
                                    if ActionState.active_sos_tasks.get(event.user) == "PENDING":
                                        return {"status": "sos_grace_period_already_active"}
                                    
                                    ActionState.active_sos_tasks[event.user] = "PENDING"
                                    background_tasks.add_task(delayed_emergency_lockdown, event.user, security_config)
                                    ActionState.last_executions[f"{event.user}_{event.gesture}"] = current_time
                                    return {"status": "sos_grace_period_started"}
                                else:
                                    return {"status": "buffering_sos", "remaining": round(4.0 - event.duration, 1)}
                        
                        mapping = session.exec(select(GestureMapping).where(
                            GestureMapping.owner_id == user_obj.id,
                            GestureMapping.gesture_name == event.gesture
                        )).first()

                        if mapping:
                            target_device = session.exec(select(Device).where(Device.id == mapping.target_device_id)).first()
                            
                            if target_device:
                                logger.info(f"DYNAMIC GESTURE: '{event.user}' mapped '{event.gesture}' to '{mapping.action}'")
                                device_id = target_device.name 
                                cached_devices = get_cached("all_devices", ttl=3600) or {}
                                curr_device_state = cached_devices.get(device_id, {})

                                if target_device.device_type == "bulb":
                                    if mapping.action == "turn_on": await control_device(device_id=device_id, control=DeviceControl(on=True))
                                    elif mapping.action == "turn_off": await control_device(device_id=device_id, control=DeviceControl(on=False))
                                    elif mapping.action == "brightness_up":
                                        new_b = min(100, curr_device_state.get("brightness", 50) + 25)
                                        await set_brightness(device_id=device_id, control=BrightnessControl(brightness=new_b))
                                        cached_devices[device_id]["brightness"] = new_b
                                        set_cache("all_devices", cached_devices)
                                    elif mapping.action == "brightness_down":
                                        new_b = max(1, curr_device_state.get("brightness", 50) - 25)
                                        await set_brightness(device_id=device_id, control=BrightnessControl(brightness=new_b))
                                        cached_devices[device_id]["brightness"] = new_b
                                        set_cache("all_devices", cached_devices)
                                        
                                elif target_device.device_type == "outlet":
                                    if mapping.action == "turn_on": await control_device(device_id=device_id, control=DeviceControl(on=True))
                                    elif mapping.action == "turn_off": await control_device(device_id=device_id, control=DeviceControl(on=False))
                                    elif mapping.action == "toggle":
                                        curr_state = curr_device_state.get("on", False)
                                        await control_device(device_id=device_id, control=DeviceControl(on=not curr_state))

                                ActionState.last_executions[f"{event.user}_{event.gesture}"] = current_time
                                return {"status": "dynamic_gesture_executed", "device": target_device.display_name, "action": mapping.action}
                                
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
        for person in list(presence_service.active_people.keys()):
            presence_service._log_event(person, "EXITED", location)
            
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
            if len(authorized_hosts) > 0: pass
            else: background_tasks.add_task(trigger_agent_proactively, "Guest", "entered")
        else:
            background_tasks.add_task(trigger_agent_proactively, person_name, "entered")

    return {"status": "ok"}

async def continuous_presence_check():
    await asyncio.sleep(10) 
    logger.info("Continuous presence check active.")
    while True:
        try:
            exited_people = presence_service.check_timeouts()
            for person in exited_people:
                await trigger_agent_proactively(person, "exited")
        except Exception: pass
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