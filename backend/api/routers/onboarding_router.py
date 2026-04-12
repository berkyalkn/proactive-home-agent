from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlmodel import Session, select
from database.settings import engine
from database.models import Room, User, Device
from api.routers.auth_router import get_current_user
import logging
from api.drivers.mqtt_service import mqtt_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

class RoomMatrix(BaseModel):
    name: str
    type: str
    hasSensor: bool
    hasPlug: bool
    hasLight: bool
    hasCamera: bool

class SetupRequest(BaseModel):
    homeName: str
    assistantName: str
    location: str          
    householdType: str     
    userAge: str           
    topology: str
    rooms: List[RoomMatrix]

@router.get("/diagnostic")
async def system_diagnostic():
    checks = {
        "database": False,
        "mqtt_broker": False,
        "system_status": "nominal"
    }

    try:
        with Session(engine) as session:
            session.exec(select(User)).first()
            checks["database"] = True
    except Exception as e:
        logger.error(f"DB Check Failed: {e}")
        checks["database"] = False
        checks["system_status"] = "degraded"

    try:
        if mqtt_client.is_connected():
            checks["mqtt_broker"] = True
        else:
            checks["mqtt_broker"] = False
            checks["system_status"] = "degraded"
    except Exception as e:
        logger.error(f"MQTT Check Failed: {e}")
        checks["mqtt_broker"] = False
        checks["system_status"] = "degraded"

    return checks

@router.post("/setup")
async def setup_home(request: SetupRequest, current_user: User = Depends(get_current_user)):
    try:
        with Session(engine) as session:
            created_rooms = []
            
            for r_data in request.rooms:
                unique_room_name = f"{request.homeName} - {r_data.name}"
                
                existing_room = session.exec(select(Room).where(Room.name == unique_room_name)).first()
                
                if not existing_room:
                    new_room = Room(name=unique_room_name, room_type=r_data.type)
                    session.add(new_room)
                    session.commit() 
                    session.refresh(new_room)
                    created_rooms.append(unique_room_name)
                    
                    if r_data.hasSensor:
                        session.add(Device(name=f"{r_data.name} Sensor Node", device_type="sensor", protocol="mqtt", room_id=new_room.id))
                    if r_data.hasPlug:
                        count = 2 if r_data.name == "Living Room" else 1
                        for i in range(count):
                            session.add(Device(name=f"{r_data.name} Plug {i+1}", device_type="outlet", protocol="wifi", room_id=new_room.id))
                    if r_data.hasLight:
                        session.add(Device(name=f"{r_data.name} Smart Bulb", device_type="bulb", protocol="wifi", room_id=new_room.id))
                    if r_data.hasCamera:
                        session.add(Device(name=f"{r_data.name} CCTV", device_type="camera", protocol="rtsp", room_id=new_room.id))
            
            session.commit()
            
            logger.info(f"SUCCESS: {request.homeName} setup complete for {current_user.username}")
            
            return {
                "status": "success",
                "message": f"System '{request.assistantName}' initialized successfully."
            }
            
    except Exception as e:
        logger.error(f"Setup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))