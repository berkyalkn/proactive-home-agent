from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlmodel import Session, select
from database.settings import engine
from database.models import Room, User, Device
from api.routers.auth_router import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

class DiscoveredDevice(BaseModel):
    id: str           
    display_name: str 
    ip: str
    model: str
    type: str

class RoomSetupRequest(BaseModel):
    name: str
    type: str
    sensorDevices: List[DiscoveredDevice] = []
    plugDevices: List[DiscoveredDevice] = []
    lightDevices: List[DiscoveredDevice] = []
    cameraDevices: List[DiscoveredDevice] = []

class SetupRequest(BaseModel):
    homeName: str
    assistantName: str
    topology: str
    rooms: List[RoomSetupRequest]

@router.post("/setup")
async def setup_home(request: SetupRequest, current_user: User = Depends(get_current_user)):
    try:
        with Session(engine) as session:
            old_rooms = session.exec(select(Room).where(Room.owner_id == current_user.id)).all()
            for r in old_rooms:
                session.delete(r)
            session.commit()

            icon_map = {
                "livingroom": "Sofa", "bedroom": "BedDouble", 
                "guestroom": "Coffee", "bathroom": "Droplets", "kitchen": "MapPin"
            }

            for r_data in request.rooms:
                new_room = Room(
                    display_name=r_data.name,
                    room_key=r_data.type,
                    icon_name=icon_map.get(r_data.type, "MapPin"),
                    owner_id=current_user.id
                )
                session.add(new_room)
                session.commit()
                session.refresh(new_room)
                
                for dev in r_data.sensorDevices:
                    session.add(Device(
                        name=dev.id, display_name=dev.display_name, device_type="sensor_node", protocol="mqtt", room_id=new_room.id, ip_address=dev.ip
                    ))
                for dev in r_data.lightDevices:
                    session.add(Device(
                        name=dev.id, display_name=dev.display_name, device_type="bulb", protocol="tapo_bulb", room_id=new_room.id, ip_address=dev.ip
                    ))
                for dev in r_data.plugDevices:
                    session.add(Device(
                        name=dev.id, display_name=dev.display_name, device_type="outlet", protocol="tapo", room_id=new_room.id, ip_address=dev.ip
                    ))
                for dev in r_data.cameraDevices:
                    session.add(Device(
                        name=dev.id, display_name=dev.display_name, device_type="camera", protocol="rtsp", room_id=new_room.id, ip_address=dev.ip
                    ))

            session.commit()
            logger.info(f"SUCCESS: {request.homeName} bound with unique hardware IDs for {current_user.username}")
            
            return {"status": "success", "message": "Ecosystem bound to hardware successfully."}

    except Exception as e:
        logger.error(f"Setup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/diagnostic")
async def run_diagnostic(current_user: User = Depends(get_current_user)):
    """
    Gerçek DB ve MQTT bağlantı kontrolleri.
    """
    import os
    import paho.mqtt.client as mqtt

    # Gerçek DB probe
    try:
        with Session(engine) as s:
            s.exec(select(User).limit(1)).first()
        db_ok = True
    except Exception:
        db_ok = False

    # Gerçek MQTT probe
    try:
        c = mqtt.Client()
        mqtt_broker = os.getenv("MQTT_BROKER", "127.0.0.1")
        mqtt_port = int(os.getenv("MQTT_PORT", 1883))
        c.connect(mqtt_broker, mqtt_port, 5)
        c.disconnect()
        mqtt_ok = True
    except Exception:
        mqtt_ok = False

    return {
        "status": "success" if (db_ok and mqtt_ok) else "degraded", 
        "database": db_ok,
        "mqtt_broker": mqtt_ok,
        "message": "Tüm sistemler aktif." if (db_ok and mqtt_ok) else "Bazı sistemlere erişilemiyor."
    }