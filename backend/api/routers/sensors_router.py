from fastapi import APIRouter
from api.drivers.mqtt_service import LATEST_SENSOR_DATA
import time

router = APIRouter(prefix="/api/sensors", tags=["Real Sensors"])

TIMEOUT_SECONDS = 15

@router.get("/all")
async def get_all_sensors():
    """
    Returns the latest sensor data received via MQTT.
    """
   
    current_time = time.time()
    active_devices = {}

    for device_id, data in LATEST_SENSOR_DATA.items():
        last_seen = data.get("last_seen", 0)
        
        if current_time - last_seen < TIMEOUT_SECONDS:
            active_devices[device_id] = data
        

    if not active_devices:
        return {
            "status": "waiting_for_data",
            "message": "No sensor data received yet. Please wait...",
            "data": {}
        }
    
    return active_devices