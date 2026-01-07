from langchain_core.tools import tool
import api.drivers.mqtt_service as mqtt_service
from api.routers.devices_router import (
    control_device, DeviceControl, DEVICE_REGISTRY, get_all_devices,
    set_brightness, BrightnessControl, set_color, ColorControl,
    get_bulb_status as get_bulb_status_endpoint
)
import time
import logging
import httpx

logger = logging.getLogger(__name__)

HOME_INVENTORY = {
    "livingroom": {
        "name": "Living Room",
        "sensor_node_id": "esp32_livingroom",
        "capabilities": ["temperature", "humidity", "pressure", "light", "motion"],
        "smart_devices": ["living_room_plug"],
        "smart_bulbs": ["living_room_bulb"],
        "cameras": ["main_camera"]
    },
    "bedroom": {
        "name": "Bedroom",
        "sensor_node_id": "esp32_bedroom",
        "capabilities": ["light", "motion"], 
        "smart_devices": ["bedroom_plug"],
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

@tool
async def get_home_status():
    """
    Retrieves a complete status report of the home by combining SENSORS and SMART DEVICES.
    It checks capabilities per room (e.g., Guestroom only has motion).
    Use this for ANY question about home status, specific room status, temperature, or devices.
    """
    current_time = time.time()
    sensor_data_source = mqtt_service.LATEST_SENSOR_DATA
    
    plug_data_source = await get_all_devices()
    
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

        # Smart bulb status
        room_bulbs = config.get("smart_bulbs", [])
        if room_bulbs:
            bulb_reports = []
            for bulb_id in room_bulbs:
                try:
                    bulb_status = await get_bulb_status_endpoint(device_id=bulb_id)
                    state = "ON" if bulb_status.get("on") else "OFF"
                    brightness = bulb_status.get("brightness", 0)
                    bulb_reports.append(f"{bulb_status['name']}: {state} ({brightness}%)")
                except Exception:
                    bulb_reports.append(f"{bulb_id}: OFFLINE")
            if bulb_reports:
                report_parts.append(f"  - Bulbs: {', '.join(bulb_reports)}")

        # Camera status
        room_cameras = config.get("cameras", [])
        if room_cameras:
            camera_reports = []
            for cam_id in room_cameras:
                cam_config = CAMERA_INVENTORY.get(cam_id)
                if cam_config:
                    try:
                        async with httpx.AsyncClient(timeout=2.0) as client:
                            response = await client.head(cam_config["feed_url"])
                            if response.status_code == 200:
                                camera_reports.append(f"{cam_config['name']}: LIVE")
                            else:
                                camera_reports.append(f"{cam_config['name']}: OFFLINE")
                    except Exception:
                        camera_reports.append(f"{cam_config['name']}: OFFLINE")
            if camera_reports:
                report_parts.append(f"  - Cameras: {', '.join(camera_reports)}")

        summary.append("\n".join(report_parts))

    final_report = "\n\n".join(summary)
    print(f"{final_report}\n------------------------------")
    return final_report

@tool
async def control_smart_device(location: str, action: str):
    """
    Controls REAL smart plugs via Tapo driver.
    Args:
        location: 'livingroom', 'bedroom' etc.
        action: 'on' or 'off'.
    """
    target_device_id = None
    location_lower = location.lower()
    
    for room_key, config in HOME_INVENTORY.items():
        if location_lower in room_key or location_lower in config["name"].lower():
            if config["smart_devices"]:
                target_device_id = config["smart_devices"][0] 
                break
    
    if not target_device_id:
        return f"Could not find a smart plug in '{location}'. Check if the room has smart devices."

    is_on = True if action.lower() == "on" else False

    try:
        control_payload = DeviceControl(on=is_on)
        result = await control_device(device_id=target_device_id, control=control_payload)
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
    # Find bulb in the location
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
            return f"Success: {result['name']} is now ON."
            
        elif action_lower == "off":
            control_payload = DeviceControl(on=False)
            result = await control_device(device_id=target_bulb_id, control=control_payload)
            return f"Success: {result['name']} is now OFF."
            
        elif action_lower == "set_brightness":
            if brightness is None:
                return "Error: brightness value (1-100) is required for set_brightness action."
            brightness_payload = BrightnessControl(brightness=brightness)
            result = await set_brightness(device_id=target_bulb_id, control=brightness_payload)
            return f"Success: Bulb brightness set to {brightness}%."
        
        elif action_lower == "increase_brightness":
            # Get current brightness and increase by 20%
            current_status = await get_bulb_status_endpoint(device_id=target_bulb_id)
            current_brightness = current_status.get("brightness", 50)
            new_brightness = min(100, current_brightness + 20)
            brightness_payload = BrightnessControl(brightness=new_brightness)
            await set_brightness(device_id=target_bulb_id, control=brightness_payload)
            return f"Success: Bulb brightness increased from {current_brightness}% to {new_brightness}%."
        
        elif action_lower == "decrease_brightness":
            # Get current brightness and decrease by 20%
            current_status = await get_bulb_status_endpoint(device_id=target_bulb_id)
            current_brightness = current_status.get("brightness", 50)
            new_brightness = max(1, current_brightness - 20)
            brightness_payload = BrightnessControl(brightness=new_brightness)
            await set_brightness(device_id=target_bulb_id, control=brightness_payload)
            return f"Success: Bulb brightness decreased from {current_brightness}% to {new_brightness}%."
            
        elif action_lower == "set_color":
            if hue is None or saturation is None:
                return "Error: hue (0-360) and saturation (0-100) are required for set_color action."
            color_payload = ColorControl(hue=hue, saturation=saturation)
            result = await set_color(device_id=target_bulb_id, control=color_payload)
            if saturation == 0:
                return "Success: Bulb set to white/daylight mode."
            return f"Success: Bulb color set to hue={hue}, saturation={saturation}."
            
        else:
            return f"Unknown action '{action}'. Use: on, off, set_brightness, or set_color."
            
    except Exception as e:
        logger.error(f"Bulb control error: {e}")
        return f"Failed to control bulb: {str(e)}"


tools_list = [get_home_status, control_smart_device, control_bulb]