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


class ActionState:
    last_executions = {}
    active_sos_tasks = {} 

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

    elif event_type == "fall_detected":
        system_prompt = (
            f"[User: Admin] "
            f"CRITICAL SYSTEM DIRECTIVE: DO NOT use any tools. DO NOT check home status. "
            f"The home vision system has JUST DETECTED a confirmed fall at {current_time}. "
            f"This is an AUTOMATED DETECTION — the person passed velocity filtering and "
            f"remained motionless for 3 seconds after falling. "
            f"The notification system has ALREADY alerted the emergency contact. "
            f"Your ONLY job is to announce this to the room. "
            f"Say EXACTLY THIS: 'Attention. The camera system has detected a fall. "
            f"Emergency contacts have been notified. If you are okay,"
            f"say something.' "
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


async def execute_emergency_lockdown(person_name: str, settings: SecuritySettings):
    logger.warning(f"EMERGENCY LOCKDOWN INITIATED BY {person_name}")
    
    async def flash_lights_dynamic():
        try:
            with Session(engine) as session:
                bulbs = session.exec(select(Device).where(Device.device_type == "bulb")).all()
                if not bulbs: return
                
                loop_count = getattr(settings, 'emergency_duration', 10) // 2 
                color_setting = getattr(settings, 'emergency_light_color', 'red')
                
                for i in range(loop_count):
                    for bulb in bulbs:
                        if color_setting == "blue":
                            target_hue = 240
                        elif color_setting == "police":
                            target_hue = 0 if i % 2 == 0 else 240
                        else: 
                            target_hue = 0
                            
                        try:
                            await asyncio.wait_for(set_color(device_id=bulb.name, control=ColorControl(hue=target_hue, saturation=100)), timeout=1.0)
                            await asyncio.wait_for(set_brightness(device_id=bulb.name, control=BrightnessControl(brightness=100)), timeout=1.0)
                        except Exception as e:
                            pass
                        
                    await asyncio.sleep(1.0)
                    
                    for bulb in bulbs:
                        try:
                            await asyncio.wait_for(control_device(device_id=bulb.name, control=DeviceControl(on=False)), timeout=1.0)
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
    
    alert_telegram = (
        f"*EMERGENCY ALERT* \n\n"
        f"*Reporter:* {person_name}\n"
        f"*Location:* Smart Home Center\n"
        f"*Status:* Home security protocol manually triggered!\n\n"
        f"Please contact {person_name} immediately."
    )
    
    tts_voice = f"Attention. An emergency alarm has been triggered by {person_name}. Security protocol is active. {target_name} has been notified via SMS and voice call."

    if settings.use_telegram:
        asyncio.create_task(notifier.send_telegram_alert(alert_telegram))
        
    if settings.use_sms and target_phone:
        asyncio.create_task(notifier.send_sms(target_phone, alert_sms))
        
    if settings.use_voice_call and target_phone:
        asyncio.create_task(notifier.make_voice_call(target_phone, tts_voice))

    active_channels = []
    if settings.use_voice_call: active_channels.append("phone call")
    if settings.use_sms: active_channels.append("SMS")
    if settings.use_telegram: active_channels.append("Telegram")

    notification_status = "No external notifications were sent."
    if active_channels:
        if len(active_channels) > 1:
            channels_str = ", ".join(active_channels[:-1]) + " and " + active_channels[-1]
        else:
            channels_str = active_channels[0]
        notification_status = f"{target_name} has been notified via {channels_str}."

    user_announcement = getattr(settings, 'emergency_action_text', 'Security protocol activated.')
    
    system_prompt = (
        f"[User: Admin] "
        f"CRITICAL SYSTEM DIRECTIVE: "
        f"An emergency override was JUST TRIGGERED manually by {person_name}. "
        f"The backend system HAS ALREADY executed hardware lockdowns (flashing lights). "
        f"The backend system HAS ALREADY contacted the authorities and sent SMS/Telegram messages. "
        f"DO NOT USE ANY TOOLS. I REPEAT, DO NOT TRIGGER THE EMERGENCY ALERT TOOL BECAUSE ALERTS ARE ALREADY SENT! "
        f"Your ONLY job is to announce the emergency to the room out loud. "
        f"The user wrote this specific custom directive to tell the intruder/room: '{user_announcement}'\n"
        f"Also, seamlessly include this status update: '{notification_status}' "
        f"Create a terrifying, highly authoritative 2-sentence security warning incorporating the user's directive."
    )
    
    async def broadcast(message_dict: dict):
        for connection in manager.active_connections:
            try:
                await manager.send_json(message_dict, connection)
            except:
                pass

    try:
        await broadcast({"status": "processing"})
        sentence_buffer = ""
        async for chunk in chat_with_ai(user_input=system_prompt, thread_id="emergency_thread"):
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

        await broadcast({"status": "stream_finished"})
    except Exception as e:
        logger.error(f"Emergency TTS error: {e}")


async def delayed_emergency_lockdown(person_name: str, settings: SecuritySettings):
    """5 Saniyelik Sessiz Bekleme (Grace Period) ve İptal Motoru"""
    logger.info(f"🚨 SOS GRACE PERIOD STARTED: {person_name} has 5 seconds to cancel...")
    
    try:
        with Session(engine) as session:
            bulbs = session.exec(select(Device).where(Device.device_type == "bulb")).all()
            
            for bulb in bulbs:
                try:
                    await asyncio.wait_for(set_color(device_id=bulb.name, control=ColorControl(hue=0, saturation=100)), timeout=1.0)
                except Exception:
                    pass

        await asyncio.sleep(1.0)
        
        with Session(engine) as session:
            bulbs = session.exec(select(Device).where(Device.device_type == "bulb")).all()
            
            for bulb in bulbs:
                try:
                    await asyncio.wait_for(set_color(device_id=bulb.name, control=ColorControl(hue=0, saturation=0)), timeout=1.0)
                except Exception:
                    pass
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
                        
                        security_config = session.exec(select(SecuritySettings).where(
                            SecuritySettings.owner_id == user_obj.id
                        )).first()

                        if security_config:
                            if getattr(security_config, 'emergency_cancel_gesture', "Open_Palm") == event.gesture:
                                if event.duration >= 2.0:
                                    if ActionState.active_sos_tasks.get(event.user) == "PENDING":
                                        ActionState.active_sos_tasks[event.user] = "CANCELLED"
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
                                    remaining = round(4.0 - event.duration, 1)
                                    return {"status": "buffering_sos", "remaining": remaining}
                        
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


async def execute_fall_emergency(confidence: float, screenshot_bytes: Optional[bytes]):
    logger.critical(f"FALL EMERGENCY PROTOCOL — Confidence: {confidence:.0%}")

    with Session(engine) as session:
        settings = session.exec(select(SecuritySettings)).first()

    if not settings or not settings.is_active:
        logger.warning("SecuritySettings not found or inactive. Only agent announcement will run.")
        await trigger_agent_proactively("System", "fall_detected")
        return

    if not getattr(settings, 'use_fall_detection', True):
        logger.info("Fall detection is DISABLED by the user in settings. Ignoring alert.")
        return

    target_phone = settings.emergency_phone
    target_name = settings.emergency_contact_name

    alert_text = (
        f"⚠️ *FALL DETECTED*\n\n"
        f"The home camera system detected a fall.\n"
        f"Confidence: {confidence:.0%}\n"
        f"Please check immediately."
    )

    tts_voice = (
        "Attention. The smart home camera system has detected a fall. "
        f"{target_name}, please check the situation immediately."
    )

    if settings.use_telegram:
        if screenshot_bytes:
            asyncio.create_task(notifier.send_telegram_photo(screenshot_bytes, alert_text))
        else:
            asyncio.create_task(notifier.send_telegram_alert(alert_text))

    if settings.use_sms and target_phone:
        sms_text = f"FALL DETECTED by home camera (confidence: {confidence:.0%}). Please check immediately."
        asyncio.create_task(notifier.send_sms(target_phone, sms_text))

    if settings.use_voice_call and target_phone:
        asyncio.create_task(notifier.make_voice_call(target_phone, tts_voice))

    await trigger_agent_proactively("System", "fall_detected")


@router.post("/fall_alert")
async def handle_fall_alert(request: Request, background_tasks: BackgroundTasks):
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
    background_tasks.add_task(execute_fall_emergency, confidence, screenshot_bytes)

    return {"status": "fall_alert_received"}


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