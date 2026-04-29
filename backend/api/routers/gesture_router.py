from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict
from pydantic import BaseModel
import uuid

from database.settings import engine
from database.models import User, Device, GestureMapping
from api.routers.auth_router import get_current_user

router = APIRouter(prefix="/gestures", tags=["Gestures"])

class GestureSaveRequest(BaseModel):
    gesture_name: str
    target_device_id: uuid.UUID
    action: str

@router.get("/available-actions")
def get_available_actions(current_user: User = Depends(get_current_user)):
    """
    It returns a list of actions the user can take based on their device.
    """
    with Session(engine) as session:
        devices = session.exec(
            select(Device).where(Device.room.has(owner_id=current_user.id))
        ).all()

        actions = []
        for dev in devices:
            if dev.device_type == "outlet":
                actions.append({"device_id": str(dev.id), "device_name": dev.display_name, "action": "turn_on", "label": f"{dev.display_name} - Turn On"})
                actions.append({"device_id": str(dev.id), "device_name": dev.display_name, "action": "turn_off", "label": f"{dev.display_name} - Turn Off"})
                actions.append({"device_id": str(dev.id), "device_name": dev.display_name, "action": "toggle", "label": f"{dev.display_name} - Toggle Power"})
            
            elif dev.device_type == "bulb":
                actions.append({"device_id": str(dev.id), "device_name": dev.display_name, "action": "turn_on", "label": f"{dev.display_name} - Turn On"})
                actions.append({"device_id": str(dev.id), "device_name": dev.display_name, "action": "turn_off", "label": f"{dev.display_name} - Turn Off"})
                actions.append({"device_id": str(dev.id), "device_name": dev.display_name, "action": "brightness_up", "label": f"{dev.display_name} - Increase Brightness"})
                actions.append({"device_id": str(dev.id), "device_name": dev.display_name, "action": "brightness_down", "label": f"{dev.display_name} - Decrease Brightness"})

        return {"available_actions": actions}

@router.get("/mappings")
def get_mappings(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        mappings = session.exec(select(GestureMapping).where(GestureMapping.owner_id == current_user.id)).all()
        return {"mappings": [{"id": m.id, "gesture_name": m.gesture_name, "target_device_id": str(m.target_device_id), "action": m.action} for m in mappings]}

@router.post("/mappings")
def save_mapping(request: GestureSaveRequest, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        existing = session.exec(select(GestureMapping).where(
            GestureMapping.owner_id == current_user.id,
            GestureMapping.gesture_name == request.gesture_name
        )).first()
        
        if existing:
            existing.target_device_id = request.target_device_id
            existing.action = request.action
            session.add(existing)
        else:
            new_map = GestureMapping(
                owner_id=current_user.id,
                gesture_name=request.gesture_name,
                target_device_id=request.target_device_id,
                action=request.action
            )
            session.add(new_map)
            
        session.commit()
        return {"status": "success", "message": "Gesture mapped successfully"}