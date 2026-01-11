from langchain_core.tools import tool
import api.drivers.mqtt_service as mqtt_service
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
        "feed_url": "http://100.90.235.67:5001/video_feed"
    }
}

SENSOR_TIMEOUT_SECONDS = 120


async def _fetch_bulb_status(bulb_id: str) -> tuple:
    """Fetch single bulb status with caching, returns (bulb_id, status or None)."""
    cache_key = f"bulb_{bulb_id}"
    cached = get_cached(cache_key)
    if cached:
        return (bulb_id, cached)
    try:
        status = await get_bulb_status_endpoint(device_id=bulb_id)
        set_cache(cache_key, status)
        return (bulb_id, status)
    except Exception:
        return (bulb_id, None)


async def _fetch_camera_status(cam_id: str, feed_url: str) -> tuple:
    """Fetch single camera status with caching, returns (cam_id, is_live)."""
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
    Retrieves a complete status report of the home by combining SENSORS and SMART DEVICES.
    It checks capabilities per room (e.g., Guestroom only has motion).
    Use this for ANY question about home status, specific room status, temperature, or devices.
    """
    current_time = time.time()
    sensor_data_source = mqtt_service.LATEST_SENSOR_DATA
    
    cached_devices = get_cached("all_devices")
    if cached_devices:
        plug_data_source = cached_devices
    else:
        plug_data_source = await get_all_devices()
        set_cache("all_devices", plug_data_source)
    
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
        if isinstance(result, Exception):
            continue
        if isinstance(result, tuple) and len(result) == 2:
            key, value = result
            if i < len(bulb_tasks):
                bulb_statuses[key] = value
            else:
                camera_statuses[key] = value
    
    print(f"\n--- AI ADVANCED DIAGNOSTIC ---")
    
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
                sensor_reports = []
                
                if "temperature" in capabilities:
                    val = node_data.get("temperature", "N/A")
                    sensor_reports.append(f"Temp: {val}°C")
                
                if "humidity" in capabilities:
                    val = node_data.get("humidity", "N/A")
                    sensor_reports.append(f"Hum: {val}%")
                
                if "pressure" in capabilities:
                    val = node_data.get("pressure", "N/A")
                    sensor_reports.append(f"Press: {val}hPa")
                
                if "light" in capabilities:
                    val = node_data.get("light_level", "N/A")
                    sensor_reports.append(f"Light: {val}")
                
                if "motion" in capabilities:
                    is_motion = node_data.get("motion", False)
                    val = "Active!" if is_motion else "Clear"
                    sensor_reports.append(f"Motion: {val}")
                
                report_parts.append(f"  - Sensors (Online): {', '.join(sensor_reports)}")

        if room_plugs:
            plug_reports = []
            for plug_id in room_plugs:
                plug_info = plug_data_source.get(plug_id)
                if plug_info:
                    state = "ON" if plug_info.get("on") else "OFF"
                    power = plug_info.get("power", 0)
                    plug_reports.append(f"{plug_info['name']}: {state} ({power}W)")
                else:
                    plug_reports.append(f"{plug_id}: Unknown Status")
            
            report_parts.append(f"  - Devices: {', '.join(plug_reports)}")
        else:
            report_parts.append("  - Devices: None")

        room_bulbs = config.get("smart_bulbs", [])
        if room_bulbs:
            bulb_reports = []
            for bulb_id in room_bulbs:
                bulb_status = bulb_statuses.get(bulb_id)
                if bulb_status:
                    state = "ON" if bulb_status.get("on") else "OFF"
                    brightness = bulb_status.get("brightness", 0)
                    bulb_reports.append(f"{bulb_status['name']}: {state} ({brightness}%)")
                else:
                    bulb_reports.append(f"{bulb_id}: OFFLINE")
            if bulb_reports:
                report_parts.append(f"  - Bulbs: {', '.join(bulb_reports)}")

        room_cameras = config.get("cameras", [])
        if room_cameras:
            camera_reports = []
            for cam_id in room_cameras:
                cam_config = CAMERA_INVENTORY.get(cam_id)
                if cam_config:
                    is_live = camera_statuses.get(cam_id, False)
                    status_text = "LIVE" if is_live else "OFFLINE"
                    camera_reports.append(f"{cam_config['name']}: {status_text}")
            if camera_reports:
                report_parts.append(f"  - Cameras: {', '.join(camera_reports)}")

        summary.append("\n".join(report_parts))

    final_report = "\n\n".join(summary)
    print(f"{final_report}\n------------------------------")
    return final_report


@tool
async def control_smart_device(target: str, action: str):
    """
    Controls REAL smart plugs via Tapo driver.
    Args:
        target: The specific device name (e.g., 'oven', 'desk lamp') OR the room name (e.g., 'livingroom').
        action: 'on' or 'off'.
    """
    target_device_id = None
    target_lower = target.lower()
    
    for dev_id, dev_info in DEVICE_REGISTRY.items():
        if dev_info.get("type") == "outlet":
            if target_lower in dev_info["name"].lower():
                target_device_id = dev_id
                break

    if not target_device_id:
        for room_key, config in HOME_INVENTORY.items():
            if target_lower in room_key or target_lower in config["name"].lower():
                if config["smart_devices"]:
                    target_device_id = config["smart_devices"][0] 
                    break
    
    if not target_device_id:
        return f"Could not find a smart plug matching '{target}'. Try specifying the device name (e.g., 'Oven', 'Desk Lamp')."

    is_on = True if action.lower() == "on" else False

    try:
        control_payload = DeviceControl(on=is_on)
        result = await control_device(device_id=target_device_id, control=control_payload)
        
        invalidate_cache("all_devices")
        
        status_text = "ON" if result["on"] else "OFF"
        return f"Success: {result['name']} is now {status_text}."
    except Exception as e:
        logger.error(f"AI Device Control Error: {e}")
        return f"Failed to control device: {str(e)}"

@tool
async def control_bulb(location: str, action: str, brightness: int = None, hue: int = None, saturation: int = None):
    """
    Controls a smart bulb in the specified location.
    Args:
        location: Room name (e.g., 'bedroom', 'livingroom').
        action: 'on', 'off', 'set_brightness', 'increase_brightness', 'decrease_brightness', or 'set_color'.
        brightness: 1-100 percentage (required when action='set_brightness').
        hue: 0-360 color wheel degree (required when action='set_color').
        saturation: 0-100 color intensity (required when action='set_color').
    """
    target_bulb_id = None
    location_lower = location.lower()
    
    for room_key, config in HOME_INVENTORY.items():
        if location_lower in room_key or location_lower in config["name"].lower():
            if config.get("smart_bulbs"):
                target_bulb_id = config["smart_bulbs"][0]
                break
    
    if not target_bulb_id:
        return f"Could not find a smart bulb in '{location}'. Available: bedroom, livingroom."

    action_lower = action.lower()
    
    try:
        if action_lower == "on":
            control_payload = DeviceControl(on=True)
            result = await control_device(device_id=target_bulb_id, control=control_payload)
            invalidate_cache("all_devices")
            invalidate_cache(f"bulb_{target_bulb_id}")
            return f"Success: {result['name']} is now ON."
            
        elif action_lower == "off":
            control_payload = DeviceControl(on=False)
            result = await control_device(device_id=target_bulb_id, control=control_payload)
            invalidate_cache("all_devices")
            invalidate_cache(f"bulb_{target_bulb_id}")
            return f"Success: {result['name']} is now OFF."
            
        elif action_lower == "set_brightness":
            if brightness is None:
                return "Error: brightness value (1-100) is required for set_brightness action."
            brightness_payload = BrightnessControl(brightness=brightness)
            result = await set_brightness(device_id=target_bulb_id, control=brightness_payload)
            invalidate_cache("all_devices")
            invalidate_cache(f"bulb_{target_bulb_id}")
            return f"Success: Bulb brightness set to {brightness}%."
        
        elif action_lower == "increase_brightness":
            current_status = await get_bulb_status_endpoint(device_id=target_bulb_id)
            current_brightness = current_status.get("brightness", 50)
            new_brightness = min(100, current_brightness + 20)
            brightness_payload = BrightnessControl(brightness=new_brightness)
            await set_brightness(device_id=target_bulb_id, control=brightness_payload)
            invalidate_cache("all_devices")
            invalidate_cache(f"bulb_{target_bulb_id}")
            return f"Success: Bulb brightness increased from {current_brightness}% to {new_brightness}%."
        
        elif action_lower == "decrease_brightness":
            current_status = await get_bulb_status_endpoint(device_id=target_bulb_id)
            current_brightness = current_status.get("brightness", 50)
            new_brightness = max(1, current_brightness - 20)
            brightness_payload = BrightnessControl(brightness=new_brightness)
            await set_brightness(device_id=target_bulb_id, control=brightness_payload)
            invalidate_cache("all_devices")
            invalidate_cache(f"bulb_{target_bulb_id}")
            return f"Success: Bulb brightness decreased from {current_brightness}% to {new_brightness}%."
            
        elif action_lower == "set_color":
            if hue is None or saturation is None:
                return "Error: hue (0-360) and saturation (0-100) are required for set_color action."
            color_payload = ColorControl(hue=hue, saturation=saturation)
            result = await set_color(device_id=target_bulb_id, control=color_payload)
            invalidate_cache("all_devices")
            invalidate_cache(f"bulb_{target_bulb_id}")
            if saturation == 0:
                return "Success: Bulb set to white/daylight mode."
            return f"Success: Bulb color set to hue={hue}, saturation={saturation}."
            
        else:
            return f"Unknown action '{action}'. Use: on, off, set_brightness, or set_color."
            
    except Exception as e:
        logger.error(f"Bulb control error: {e}")
        return f"Failed to control bulb: {str(e)}"


tools_list = [get_home_status, control_smart_device, control_bulb]