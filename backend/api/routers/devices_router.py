from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devices", tags=["Mock Devices"])

MOCK_DEVICES_STATE = {
    "living_room_light": {"name": "Living Room Light", "on": False, "type": "light"},
    "main_outlet": {"name": "Smart Plug (Tapo)", "on": False, "type": "outlet"},
    "kitchen_light": {"name": "Kitchen light", "on": True, "type": "light"}
}

class DeviceControl(BaseModel):
    on: bool

@router.get("/")
async def get_all_devices() -> Dict[str, dict]:
    """Returns the current state of all mock devices"""
    return MOCK_DEVICES_STATE

@router.post("/{device_id}")
async def control_device(device_id: str, control: DeviceControl):
    """Controls a specific mock device by turning it on/off"""
    if device_id not in MOCK_DEVICES_STATE:
        raise HTTPException(status_code=404, detail="Mock device not found")

    MOCK_DEVICES_STATE[device_id]["on"] = control.on
    logger.info(f"(Mock) Device '{device_id}' set to {control.on}")
    
    return MOCK_DEVICES_STATE[device_id]