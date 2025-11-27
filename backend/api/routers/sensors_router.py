from fastapi import APIRouter
from api.drivers.mqtt_service import LATEST_SENSOR_DATA

router = APIRouter(prefix="/api/sensors", tags=["Real Sensors"])

@router.get("/all")
async def get_all_sensors():
    """
    Returns the latest sensor data received via MQTT.
    """
    if not LATEST_SENSOR_DATA:
        return {
            "status": "waiting_for_data",
            "message": "No sensor data received yet. Please wait...",
            "data": {}
        }
    
    return LATEST_SENSOR_DATA