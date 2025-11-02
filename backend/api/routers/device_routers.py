from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devices", tags=["Mock Devices"])

MOCK_DEVICES_STATE = {
    "living_room_light": {"on": False, "type": "light"},
    "main_outlet": {"on": True, "type": "outlet"}
}

class DeviceControl(BaseModel):
    status: bool

@router.get("/")
async def get_all_devices() -> Dict[str, dict]:
    return MOCK_DEVICES_STATE

@router.post("/{device_id}")
async def control_device(device_id: str, control: DeviceControl):
    if device_id not in MOCK_DEVICES_STATE:
        raise HTTPException(status_code=404, detail="Mock device not found")

    MOCK_DEVICES_STATE[device_id]["on"] = control.status
    logger.info(f"(Mock) Device '{device_id}' set to {control.status}")
    return MOCK_DEVICES_STATE[device_id]