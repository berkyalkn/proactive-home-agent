from langchain_core.tools import tool
import api.drivers.mqtt_service as mqtt_service
from api.routers.devices_router import control_device, DeviceControl, DEVICE_REGISTRY, get_all_devices
import time
import logging

logger = logging.getLogger(__name__)

HOME_INVENTORY = {
    "livingroom": {
        "name": "Living Room",
        "sensor_node_id": "esp32_livingroom",
        "capabilities": ["temperature", "humidity", "pressure", "light", "motion"],
        "smart_devices": ["living_room_plug"] 
    },
    "bedroom": {
        "name": "Bedroom)",
        "sensor_node_id": "esp32_bedroom",
        "capabilities": ["light", "motion"], 
        "smart_devices": ["bedroom_plug"]
    },
    "guestroom": {
        "name": "Guestroom",
        "sensor_node_id": "esp32_guestroom",
        "capabilities": ["motion"], 
        "smart_devices": [] 
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


tools_list = [get_home_status, control_smart_device]