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
    checks = {"database": False, "mqtt_broker": False, "system_status": "nominal"}
    try:
        with Session(engine) as session:
            session.exec(select(User)).first()
            checks["database"] = True
    except Exception as e:
        logger.error(f"DB Check Failed: {e}"); checks["system_status"] = "degraded"

    try:
        checks["mqtt_broker"] = mqtt_client.is_connected() if hasattr(mqtt_client, 'is_connected') else False
        if not checks["mqtt_broker"]: checks["system_status"] = "degraded"
    except Exception as e:
        logger.error(f"MQTT Check Failed: {e}"); checks["system_status"] = "degraded"
    return checks

@router.post("/setup")
async def setup_home(request: SetupRequest, current_user: User = Depends(get_current_user)):
    try:
        with Session(engine) as session:
            old_rooms = session.exec(select(Room).where(Room.owner_id == current_user.id)).all()
            for r in old_rooms: session.delete(r)
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
                
                if r_data.hasSensor:
                    session.add(Device(
                        name=f"esp32_{r_data.type}", 
                        device_type="sensor_node", 
                        protocol="mqtt", 
                        room_id=new_room.id
                    ))
                
                if r_data.hasPlug:
                    session.add(Device(
                    name="Plug1 (Oven)",  
                    device_type="outlet", 
                    protocol="tapo", 
                    room_id=new_room.id
                    ))

                if r_data.hasLight:
                    session.add(Device(
                        name=f"{r_data.name} Bulb", 
                        device_type="bulb", 
                        protocol="tapo_bulb", 
                        room_id=new_room.id
                    ))
            
            session.commit()
            logger.info(f"SUCCESS: {request.homeName} setup complete for {current_user.username}")
            
            return {
                "status": "success",
                "message": f"System '{request.assistantName}' initialized for {current_user.username}."
            }
            
    except Exception as e:
        logger.error(f"Setup Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))