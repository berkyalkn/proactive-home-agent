from langchain_core.tools import tool
import api.drivers.mqtt_service as mqtt_service
from api.services.presence_service import presence_service
from api.routers.devices_router import (
    control_device, DeviceControl, get_all_devices,
    set_brightness, BrightnessControl, set_color, ColorControl
)
from api.agent.cache import get_cached, set_cache, invalidate_cache
from sqlmodel import Session, select
from database.settings import engine
from database.models import Room, Device
import asyncio
import time
import logging
import httpx

logger = logging.getLogger(__name__)

DEVICE_TIMEOUT = 2.0  
SENSOR_TIMEOUT_SECONDS = 120

async def _fetch_camera_status(cam_id: str, feed_url: str) -> tuple:
    cache_key = f"camera_{cam_id}"
    cached = get_cached(cache_key, ttl=5)
    if cached is not None:
        return (cam_id, cached)
    
    is_live = False
    if feed_url:
        try:
            url = feed_url if feed_url.startswith("http") else f"http://{feed_url}"
            async with httpx.AsyncClient(timeout=1.0) as client:
                response = await client.head(url)
                is_live = response.status_code < 500
        except Exception:
            is_live = False
            
    set_cache(cache_key, is_live)
    return (cam_id, is_live)

@tool
async def get_home_status():
    """
    Retrieves a complete status report of the home by combining SENSORS, SMART DEVICES, and PEOPLE PRESENCE.
    Use this for ANY question about who is home, what room they are in, recent events, home status, temperature, or devices.
    """

    current_time = time.time()
    sensor_data_source = mqtt_service.LATEST_SENSOR_DATA
    
    cached_devices = get_cached("all_devices", ttl=3600)
    if not cached_devices:
        logger.info("Cache Empty! Triggering a manual device scan for home status...")
        try:
            cached_devices = await asyncio.wait_for(get_all_devices(), timeout=4.0)
            set_cache("all_devices", cached_devices)
        except Exception as e:
            logger.warning(f"Live device scan failed: {e}")
            cached_devices = {}

    summary = []
    
    with Session(engine) as session:
        rooms = session.exec(select(Room)).all()
        
        camera_tasks = []
        for room in rooms:
            for dev in room.devices:
                if dev.device_type == "camera":
                    camera_tasks.append(_fetch_camera_status(dev.name, dev.ip_address))
        
        all_cam_results = await asyncio.gather(*camera_tasks, return_exceptions=True)
        camera_statuses = {res[0]: res[1] for res in all_cam_results if isinstance(res, tuple)}
        
        for room in rooms:
            report_parts = [f"ROOM: {room.display_name}"]
            
            sensors = [d for d in room.devices if d.device_type == "sensor_node"]
            plugs = [d for d in room.devices if d.device_type == "outlet"]
            bulbs = [d for d in room.devices if d.device_type == "bulb"]
            cameras = [d for d in room.devices if d.device_type == "camera"]
            
            if not sensors:
                report_parts.append("  - Sensors: No sensors installed.")
            else:
                for sensor in sensors:
                    node_data = sensor_data_source.get(sensor.name)
                    disp_name = sensor.display_name or sensor.name
                    if not node_data:
                        report_parts.append(f"  - Sensors ({disp_name}): OFFLINE")
                    else:
                        last_seen = node_data.get("last_seen", 0)
                        if (current_time - last_seen) > SENSOR_TIMEOUT_SECONDS:
                             report_parts.append(f"  - Sensors ({disp_name}): STALE (Last seen {int((current_time - last_seen)/60)}m ago)")
                        else:
                            s_reports = []
                            if "temperature" in node_data: s_reports.append(f"Temp: {node_data.get('temperature')}°C")
                            if "humidity" in node_data: s_reports.append(f"Hum: {node_data.get('humidity')}%")
                            if "light_level" in node_data: s_reports.append(f"Light: {node_data.get('light_level')} lx")
                            if "motion_detected" in node_data: 
                                s_reports.append(f"Motion: {'Active!' if node_data.get('motion_detected') else 'Clear'}")
                            report_parts.append(f"  - Sensors ({disp_name}): {', '.join(s_reports)}")

            if plugs:
                plug_reports = []
                for plug in plugs:
                    dev_info = cached_devices.get(plug.name)
                    disp_name = plug.display_name or plug.name
                    if dev_info:
                        state = "ON" if dev_info.get("on") else "OFF"
                        power = dev_info.get("power", 0)
                        plug_reports.append(f"{disp_name}: {state} ({power}W)")
                    else:
                        plug_reports.append(f"{disp_name}: OFFLINE")
                report_parts.append(f"  - Smart Plugs: {', '.join(plug_reports)}")

            if bulbs:
                bulb_reports = []
                for bulb in bulbs:
                    dev_info = cached_devices.get(bulb.name)
                    disp_name = bulb.display_name or bulb.name
                    if dev_info:
                        state = "ON" if dev_info.get("on") else "OFF"
                        bright = dev_info.get("brightness", 0)
                        bulb_reports.append(f"{disp_name}: {state} ({bright}%)")
                    else:
                        bulb_reports.append(f"{disp_name}: OFFLINE")
                report_parts.append(f"  - Bulbs: {', '.join(bulb_reports)}")

            if cameras:
                cam_reports = []
                for cam in cameras:
                    disp_name = cam.display_name or cam.name
                    is_live = camera_statuses.get(cam.name, False)
                    cam_reports.append(f"{disp_name}: {'LIVE' if is_live else 'OFFLINE'}")
                report_parts.append(f"  - Cameras: {', '.join(cam_reports)}")

            summary.append("\n".join(report_parts))

    final_report = "\n\n".join(summary)

    presence_report = "\n\n=== PRESENCE & MEMORY LEDGER ===\n"
    active = presence_service.active_people
    if not active:
        presence_report += "- Current State: The house is EMPTY.\n"
    else:
        for name, data in active.items():
            presence_report += f"- {name} is currently in the {data['location']}\n"
    
    history = presence_service.history_ledger
    if history:
        presence_report += "- Recent History (Last 10):\n"
        for event in reversed(history[-10:]): 
            presence_report += f"  * [{event['time']}] {event['user']} {event['action']} {event['location']}\n"
    
    return final_report + presence_report


@tool
async def control_smart_device(target: str, action: str):
    """Controls REAL smart plugs. Target can be the custom name given by the user (e.g. 'Oven', 'Desk Lamp')."""

    target_device_id = None
    disp_name = target
    
    with Session(engine) as session:
        plugs = session.exec(select(Device).where(Device.device_type == "outlet")).all()
        for plug in plugs:

            name_to_check = (plug.display_name or plug.name).lower()
            if target.lower() in name_to_check:
                target_device_id = plug.name
                disp_name = plug.display_name or plug.name
                break

    if not target_device_id: 
        return f"Could not find plug matching '{target}' in the database."

    is_on = action.lower() == "on"

    try:
        result = await asyncio.wait_for(control_device(device_id=target_device_id, control=DeviceControl(on=is_on)), timeout=DEVICE_TIMEOUT)
        
        cached_devices = get_cached("all_devices", ttl=3600) or {}
        if target_device_id in cached_devices:
            cached_devices[target_device_id]["on"] = is_on
            set_cache("all_devices", cached_devices)
            
        return f"Success: {disp_name} is {action.upper()}."
    except Exception as e: 
        return f"Error: {e}"


@tool
async def control_bulb(location: str, action: str, brightness: int = None, hue: int = None, saturation: int = None):
    """Controls a smart bulb in the specified location (room name)."""
    
    target_bulb_id = None
    disp_name = None
    
    with Session(engine) as session:
        rooms = session.exec(select(Room)).all()
        for room in rooms:
            if location.lower() in room.display_name.lower() or location.lower() in room.room_key.lower():
                for dev in room.devices:
                    if dev.device_type == "bulb":
                        target_bulb_id = dev.name
                        disp_name = dev.display_name or dev.name
                        break
            if target_bulb_id: break

    if not target_bulb_id: return f"No bulb found in '{location}'."

    action_lower = action.lower()
    async def safe_control(coro): return await asyncio.wait_for(coro, timeout=DEVICE_TIMEOUT)

    try:
        if action_lower in ["on", "off"]:
            is_on = action_lower == "on"
            await safe_control(control_device(device_id=target_bulb_id, control=DeviceControl(on=is_on)))
            
            cached_devices = get_cached("all_devices", ttl=3600) or {}
            if target_bulb_id in cached_devices:
                cached_devices[target_bulb_id]["on"] = is_on
                set_cache("all_devices", cached_devices)
                
            return f"Success: {disp_name} is {action_lower.upper()}."
            
        elif action_lower == "set_brightness":
            await safe_control(set_brightness(device_id=target_bulb_id, control=BrightnessControl(brightness=brightness)))
            return f"Success: {disp_name} brightness set to {brightness}%."
            
        return "Action completed."
    except Exception as e: return f"Failed: {e}"

tools_list = [get_home_status, control_smart_device, control_bulb]