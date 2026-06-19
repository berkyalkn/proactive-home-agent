from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict
from pydantic import BaseModel
import uuid

from database.settings import engine
from database.models import User, Device, GestureMapping, SecuritySettings
from api.routers.auth_router import get_current_user

router = APIRouter(prefix="/gestures", tags=["Gestures"])

class SecuritySaveRequest(BaseModel):
    emergency_gesture: str
    emergency_cancel_gesture: str 
    emergency_contact_name: str
    emergency_phone: str
    emergency_light_color: str = "red"  
    emergency_duration: int = 10        
    emergency_action_text: str
    use_sms: bool = True           
    use_voice_call: bool = True    
    use_telegram: bool = True
    use_fall_detection: bool = True
    detect_glass_break: bool = True   
    detect_baby_cry: bool = False
    is_active: bool

class GestureSaveRequest(BaseModel):
    gesture_name: str
    target_device_id: uuid.UUID
    action: str

class BulkGestureSaveRequest(BaseModel):
    mappings: List[GestureSaveRequest]


@router.get("/available-actions")
def get_available_actions(current_user: User = Depends(get_current_user)):
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


@router.post("/mappings/bulk")
def bulk_save_mappings(request: BulkGestureSaveRequest, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        existing_mappings = session.exec(
            select(GestureMapping).where(GestureMapping.owner_id == current_user.id)
        ).all()
        
        for mapping in existing_mappings:
            session.delete(mapping)
            
        for map_req in request.mappings:
            if map_req.gesture_name: 
                new_map = GestureMapping(
                    owner_id=current_user.id,
                    gesture_name=map_req.gesture_name,
                    target_device_id=map_req.target_device_id,
                    action=map_req.action
                )
                session.add(new_map)
            
        session.commit()
        return {"status": "success", "message": "Bulk gesture mappings synced perfectly"}


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


@router.get("/security")
def get_security_settings(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        settings = session.exec(select(SecuritySettings).where(SecuritySettings.owner_id == current_user.id)).first()
        
        if not settings:
            return {
                "emergency_gesture": "Closed_Fist",
                "emergency_cancel_gesture": "Open_Palm",
                "emergency_contact_name": "",
                "emergency_phone": "",
                "emergency_light_color": "red", 
                "emergency_duration": 10,        
                "emergency_action_text": "",
                "use_sms": True,         
                "use_voice_call": True,    
                "use_telegram": True,
                "use_fall_detection": True,
                "detect_glass_break": True,  
                "detect_baby_cry": False,    
                "is_active": False
            }
            
        return {
            "emergency_gesture": settings.emergency_gesture,
            "emergency_cancel_gesture": getattr(settings, 'emergency_cancel_gesture', 'Open_Palm'),
            "emergency_contact_name": settings.emergency_contact_name,
            "emergency_phone": settings.emergency_phone,
            "emergency_light_color": getattr(settings, 'emergency_light_color', 'red'), 
            "emergency_duration": getattr(settings, 'emergency_duration', 10),           
            "emergency_action_text": settings.emergency_action_text,
            "use_sms": settings.use_sms,                 
            "use_voice_call": settings.use_voice_call,   
            "use_telegram": settings.use_telegram,
            "use_fall_detection": getattr(settings, 'use_fall_detection', True),
            "detect_glass_break": getattr(settings, 'detect_glass_break', True),  
            "detect_baby_cry": getattr(settings, 'detect_baby_cry', False),       
            "is_active": settings.is_active
        }


@router.post("/security")
def save_security_settings(request: SecuritySaveRequest, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        settings = session.exec(select(SecuritySettings).where(SecuritySettings.owner_id == current_user.id)).first()
        
        if settings:
            settings.emergency_gesture = request.emergency_gesture
            settings.emergency_cancel_gesture = request.emergency_cancel_gesture
            settings.emergency_contact_name = request.emergency_contact_name
            settings.emergency_phone = request.emergency_phone
            settings.emergency_light_color = request.emergency_light_color  
            settings.emergency_duration = request.emergency_duration        
            settings.emergency_action_text = request.emergency_action_text
            settings.use_sms = request.use_sms                 
            settings.use_voice_call = request.use_voice_call   
            settings.use_telegram = request.use_telegram
            settings.use_fall_detection = request.use_fall_detection
            settings.detect_glass_break = request.detect_glass_break  
            settings.detect_baby_cry = request.detect_baby_cry        
            settings.is_active = request.is_active
            session.add(settings)
        else:
            new_settings = SecuritySettings(
                owner_id=current_user.id,
                emergency_gesture=request.emergency_gesture,
                emergency_cancel_gesture=request.emergency_cancel_gesture,
                emergency_contact_name=request.emergency_contact_name,
                emergency_phone=request.emergency_phone,
                emergency_light_color=request.emergency_light_color,  
                emergency_duration=request.emergency_duration,        
                emergency_action_text=request.emergency_action_text,
                use_sms=request.use_sms,                       
                use_voice_call=request.use_voice_call,         
                use_telegram=request.use_telegram,
                use_fall_detection=request.use_fall_detection,
                detect_glass_break=request.detect_glass_break,  
                detect_baby_cry=request.detect_baby_cry,        
                is_active=request.is_active
            )
            session.add(new_settings)
            
        session.commit()
        return {"status": "success", "message": "Security protocol updated successfully."}