from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timedelta, timezone
import time
import uuid

from database.settings import get_session
from database.models import SensorReading, Device 
from api.drivers.mqtt_service import LATEST_SENSOR_DATA

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])

TIMEOUT_SECONDS = 15

@router.get("/all")
async def get_all_sensors():
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


@router.get("/history/{device_name}/{metric}")
async def get_sensor_history(
    device_name: str, 
    metric: str,     
    hours: int = 24,
    session: Session = Depends(get_session)
):
    """
    Historical data query.
    """
    
    device_statement = select(Device).where(Device.name == device_name)
    device = session.exec(device_statement).first()
    
    if not device:
        raise HTTPException(status_code=404, detail=f"Device '{device_name}' not found in DB")

    device_uuid = device.id

    metric_map = {
        "temperature": "temperature",
        "humidity": "humidity",
        "pressure": "pressure",
        "light_level": "light", 
        "motion": "motion"
    }
    
    db_reading_type = metric_map.get(metric)
    if not db_reading_type:
         raise HTTPException(status_code=400, detail=f"Invalid metric: {metric}")

    time_threshold = datetime.utcnow() - timedelta(hours=hours)

    statement = (
        select(SensorReading.timestamp, SensorReading.value)
        .where(SensorReading.device_id == device_uuid)    
        .where(SensorReading.reading_type == db_reading_type) 
        .where(SensorReading.timestamp >= time_threshold)
        .order_by(SensorReading.timestamp.asc())
    )

    results = session.exec(statement).all()

    data = []
    for timestamp, value in results:
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)

        data.append({
            "timestamp": timestamp,
            "value": value
        })
            
    return data