from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database.settings import engine
from database.models import Room, User, Device
from api.routers.auth_router import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/rooms", tags=["Rooms"])

class AddDeviceRequest(BaseModel):
    id: str           
    display_name: str 
    ip: str           
    device_type: str  

@router.get("/list")
def list_my_rooms(current_user: User = Depends(get_current_user)):
    """The system retrieves the rooms in the homeowner's house after they log in."""

    with Session(engine) as session:
        my_rooms = session.exec(
            select(Room).where(Room.owner_id == current_user.id)
        ).all()
        
        rooms_data = [
            {
                "id": r.room_key,
                "name": r.display_name,
                "icon": r.icon_name
            }
            for r in my_rooms
        ]
        
        return {"rooms": rooms_data}

@router.get("/{room_key}/inventory")
def get_room_inventory(room_key: str, current_user: User = Depends(get_current_user)):
    """It returns a list of the types of devices and their specific IDs present in the room."""

    with Session(engine) as session:
        room = session.exec(
            select(Room).where(Room.room_key == room_key, Room.owner_id == current_user.id)
        ).first()
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        devices = session.exec(select(Device).where(Device.room_id == room.id)).all()

        devices_dict = {}
        for d in devices:
            devices_dict[d.name] = {
                "type": d.device_type,
                "display_name": d.display_name or d.name
            }

        inventory = {
            "hasSensor": any(d.device_type == "sensor_node" for d in devices),
            "hasCamera": any(d.device_type == "camera" for d in devices),
            "hasLight": any(d.device_type == "bulb" for d in devices),
            "hasPlug": any(d.device_type == "outlet" for d in devices),
            "devices": devices_dict
        }
        
        return inventory


@router.post("/{room_key}/devices")
def add_device_to_room(room_key: str, request: AddDeviceRequest, current_user: User = Depends(get_current_user)):
    """Adds a newly discovered device to an existing room."""
    
    with Session(engine) as session:
        room = session.exec(
            select(Room).where(Room.room_key == room_key, Room.owner_id == current_user.id)
        ).first()
        
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
            
        existing_device = session.exec(select(Device).where(Device.name == request.id)).first()
        if existing_device:
            raise HTTPException(status_code=400, detail="Device is already registered in the system.")

        protocol = "unknown"
        if request.device_type == "outlet": protocol = "tapo"
        elif request.device_type == "bulb": protocol = "tapo_bulb"
        elif request.device_type == "sensor_node": protocol = "mqtt"
        elif request.device_type == "camera": protocol = "rtsp"

        new_device = Device(
            name=request.id,
            display_name=request.display_name,
            device_type=request.device_type,
            protocol=protocol,
            room_id=room.id,
            ip_address=request.ip
        )
        
        session.add(new_device)
        session.commit()
        
        return {"status": "success", "message": f"{request.display_name} successfully added to {room.display_name}."}