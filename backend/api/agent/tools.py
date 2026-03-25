from langchain_core.tools import tool
import api.drivers.mqtt_service as mqtt_service
from api.services.presence_service import presence_service
from api.routers.devices_router import (
    control_device, DeviceControl, DEVICE_REGISTRY, get_all_devices,
    set_brightness, BrightnessControl, set_color, ColorControl,
    get_bulb_status as get_bulb_status_endpoint
)
from api.agent.cache import get_cached, set_cache, invalidate_cache
import asyncio
import time
import logging
import httpx

logger = logging.getLogger(__name__)

DEVICE_TIMEOUT = 2.0  
SENSOR_TIMEOUT_SECONDS = 120

HOME_INVENTORY = {
    "livingroom": {
        "name": "Living Room",
        "sensor_node_id": "esp32_livingroom",
        "capabilities": ["temperature", "humidity", "pressure", "light", "motion"],
        "smart_devices": ["living_room_plug1", "living_room_plug2"],
        "smart_bulbs": ["living_room_bulb"],
        "cameras": ["main_camera"]
    },
    "bedroom": {
        "name": "Bedroom",
        "sensor_node_id": "esp32_bedroom",
        "capabilities": ["light", "motion"], 
        "smart_devices": [],
        "smart_bulbs": ["bedroom_bulb"],
        "cameras": []
    },
    "guestroom": {
        "name": "Guestroom",
        "sensor_node_id": "esp32_guestroom",
        "capabilities": ["motion"], 
        "smart_devices": [],
        "smart_bulbs": [],
        "cameras": []
    }
}

CAMERA_INVENTORY = {
    "main_camera": {
        "name": "Main Camera",
        "location": "livingroom",
        "feed_url": "http://100.119.128.11:5001/video_feed"
    }
}

async def _fetch_bulb_status(bulb_id: str) -> tuple:

    cache_key = f"bulb_{bulb_id}"
    cached = get_cached(cache_key)

    if cached:
        return (bulb_id, cached)
    try:
        status = await asyncio.wait_for(
            get_bulb_status_endpoint(device_id=bulb_id), 
            timeout=DEVICE_TIMEOUT
        )

        set_cache(cache_key, status)
        return (bulb_id, status)

    except asyncio.TimeoutError:
        logger.warning(f"Timeout fetching status for bulb: {bulb_id}")
        return (bulb_id, None)

    except Exception as e:
        logger.error(f"Error fetching bulb {bulb_id}: {e}")
        return (bulb_id, None)

async def _fetch_camera_status(cam_id: str, feed_url: str) -> tuple:

    cache_key = f"camera_{cam_id}"
    cached = get_cached(cache_key, ttl=5)

    if cached is not None:
        return (cam_id, cached)
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            response = await client.head(feed_url)
            is_live = response.status_code == 200

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
    
    cached_plugs = get_cached("all_devices", ttl=3600)

    if not cached_plugs:
        logger.info("Cache Empty! Triggering a manual device scan for home status...")
        try:
            cached_plugs = await asyncio.wait_for(get_all_devices(), timeout=4.0)
            set_cache("all_devices", cached_plugs)
        except Exception as e:
            logger.warning(f"Live device scan failed: {e}")
            cached_plugs = {}

    all_bulb_ids = []
    all_camera_info = []  

    for config in HOME_INVENTORY.values():
        all_bulb_ids.extend(config.get("smart_bulbs", []))
        for cam_id in config.get("cameras", []):
            cam_config = CAMERA_INVENTORY.get(cam_id)
            if cam_config:
                all_camera_info.append((cam_id, cam_config["feed_url"]))
    
    bulb_tasks = [_fetch_bulb_status(bid) for bid in all_bulb_ids]
    camera_tasks = [_fetch_camera_status(cid, url) for cid, url in all_camera_info]
    
    all_results = await asyncio.gather(*bulb_tasks, *camera_tasks, return_exceptions=True)
    
    bulb_statuses = {}  
    camera_statuses = {} 

    for i, result in enumerate(all_results):
        if isinstance(result, Exception): continue
        if isinstance(result, tuple) and len(result) == 2:
            key, value = result
            if i < len(bulb_tasks): bulb_statuses[key] = value
            else: camera_statuses[key] = value

    summary = []
    
    for room_key, config in HOME_INVENTORY.items():
        room_name = config["name"]
        node_id = config["sensor_node_id"]
        capabilities = config["capabilities"]
        room_plugs = config["smart_devices"]
        
        report_parts = [f"ROOM: {room_name}"]
        
        node_data = sensor_data_source.get(node_id)
        if not node_data:
            report_parts.append(f"  - Sensors: OFFLINE (No Signal from {node_id})")
        else:
            last_seen = node_data.get("last_seen", 0)
            if (current_time - last_seen) > SENSOR_TIMEOUT_SECONDS:
                 report_parts.append(f"  - Sensors: STALE (Last seen {int((current_time - last_seen)/60)}m ago)")
            else:
                s_reports = []
                if "temperature" in capabilities: s_reports.append(f"Temp: {node_data.get('temperature', 'N/A')}°C")
                if "humidity" in capabilities: s_reports.append(f"Hum: {node_data.get('humidity', 'N/A')}%")
                if "light" in capabilities: s_reports.append(f"Light: {node_data.get('light_level', 'N/A')}")
                if "motion" in capabilities:
                    val = "Active!" if node_data.get("motion") else "Clear"
                    s_reports.append(f"Motion: {val}")
                report_parts.append(f"  - Sensors: {', '.join(s_reports)}")

        if room_plugs:
            plug_reports = []

            for plug_id in room_plugs:
                plug_info = cached_plugs.get(plug_id)
                display_name = plug_info.get("name") if plug_info else DEVICE_REGISTRY.get(plug_id, {}).get("name", plug_id)
                
                if plug_info:
                    state = "ON" if plug_info.get("on") else "OFF"
                    power = plug_info.get("power", 0)
                    plug_reports.append(f"{display_name}: {state} ({power}W)")
                else:
                    plug_reports.append(f"{display_name}: UNKNOWN/OFFLINE")
            
            report_parts.append(f"  - Smart Plugs: {', '.join(plug_reports)}")

        room_bulbs = config.get("smart_bulbs", [])

        if room_bulbs:
            bulb_reports = []
            for bulb_id in room_bulbs:
                bulb_status = bulb_statuses.get(bulb_id)
                if bulb_status:
                    state = "ON" if bulb_status.get("on") else "OFF"
                    bright = bulb_status.get("brightness", 0)
                    bulb_reports.append(f"{bulb_status['name']}: {state} ({bright}%)")
                else:
                    bulb_reports.append(f"{bulb_id}: OFFLINE")
            report_parts.append(f"  - Bulbs: {', '.join(bulb_reports)}")

        room_cameras = config.get("cameras", [])

        if room_cameras:
            camera_reports = []
            for cam_id in room_cameras:
                cam_config = CAMERA_INVENTORY.get(cam_id)
                if cam_config:
                    is_live = camera_statuses.get(cam_id, False)
                    camera_reports.append(f"{cam_config['name']}: {'LIVE' if is_live else 'OFFLINE'}")
            report_parts.append(f"  - Cameras: {', '.join(camera_reports)}")

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
    """Controls REAL smart plugs via Tapo driver."""
    target_device_id = None
    from api.routers.devices_router import DEVICE_REGISTRY

    for dev_id, dev_info in DEVICE_REGISTRY.items():
        if dev_info.get("type") == "outlet" and target.lower() in dev_info["name"].lower():
            target_device_id = dev_id
            break
    if not target_device_id: return f"Could not find plug '{target}'."

    is_on = action.lower() == "on"

    try:
        result = await asyncio.wait_for(control_device(device_id=target_device_id, control=DeviceControl(on=is_on)), timeout=DEVICE_TIMEOUT)
        cached_devices = get_cached("all_devices", ttl=3600) or {}
        cached_devices[target_device_id] = {"name": result.get("name"), "on": is_on}
        set_cache("all_devices", cached_devices)
        return f"Success: {result['name']} is {action.upper()}."
    except Exception as e: return f"Error: {e}"


@tool
async def control_bulb(location: str, action: str, brightness: int = None, hue: int = None, saturation: int = None):
    """Controls a smart bulb in the specified location."""
    target_bulb_id = None
    for room_key, config in HOME_INVENTORY.items():
        if location.lower() in room_key or location.lower() in config["name"].lower():
            if config.get("smart_bulbs"):
                target_bulb_id = config["smart_bulbs"][0]
                break

    if not target_bulb_id: return f"No bulb in '{location}'."

    action_lower = action.lower()
    async def safe_control(coro): return await asyncio.wait_for(coro, timeout=DEVICE_TIMEOUT)

    try:
        if action_lower in ["on", "off"]:
            is_on = action_lower == "on"
            result = await safe_control(control_device(device_id=target_bulb_id, control=DeviceControl(on=is_on)))
            set_cache(f"bulb_{target_bulb_id}", result)
            return f"Success: {result['name']} is {action_lower.upper()}."
        elif action_lower == "set_brightness":
            await safe_control(set_brightness(device_id=target_bulb_id, control=BrightnessControl(brightness=brightness)))
            new_status = await safe_control(get_bulb_status_endpoint(device_id=target_bulb_id))
            set_cache(f"bulb_{target_bulb_id}", new_status)
            return f"Success: Brightness set to {brightness}%."
        return "Action completed."
    except Exception as e: return f"Failed: {e}"

tools_list = [get_home_status, control_smart_device, control_bulb]