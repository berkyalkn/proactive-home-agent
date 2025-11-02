from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import os
from dotenv import load_dotenv
from tapo import ApiClient
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devices", tags=["Real Devices"])
load_dotenv()

TAPO_USERNAME = os.getenv("TAPO_USERNAME")
TAPO_PASSWORD = os.getenv("TAPO_PASSWORD")

REAL_DEVICES = {
    "living_room_light": {
        "ip": os.getenv("LIVING_ROOM_LIGHT_IP"),
        "name": "Living Room Light",
        "type": "light"
    },
    "bedroom_light": {
        "ip": os.getenv("BEDROOM_LIGHT_IP"),
        "name": "Bedroom Light",
        "type": "light"
    }
}

MOCK_DEVICES_STATE = {
    "kitchen_light": {"name": "Kitchen Light", "on": False, "type": "light"}
}

tapo_device_objects: Dict[str, ApiClient] = {}

async def initialize_tapo_devices():
    """When the server starts, it connects to all Tapo devices."""
    if not all([TAPO_USERNAME, TAPO_PASSWORD]):
        logger.error("TAPO credentials are missing in the .env file. Devices cannot be started.")
        return

    client = ApiClient(TAPO_USERNAME, TAPO_PASSWORD)
    
    for device_id, config in REAL_DEVICES.items():
        ip = config["ip"]
        if not ip:
            logger.warning(f"⚠️ '{device_id}' IP address is not set in the .env file. Skipping.")
            continue
        
        try:
            device = await client.p110(ip)
            tapo_device_objects[device_id] = device
            logger.info(f"'{config['name']}' ({ip}) connected successfully.")
        except Exception as e:
            logger.error(f"'{config['name']}' ({ip}) connection failed: {e}")
            pass

class DeviceControl(BaseModel):
    on: bool


@router.get("/")
async def get_all_devices() -> Dict[str, dict]:
    """Returns the current state of all *connected* real devices."""
    
    response_state = {}
    
    for device_id, device in tapo_device_objects.items():
        try:
            info = await device.get_device_info()
            is_on = info.to_dict().get("device_on", False)
            
            response_state[device_id] = {
                "name": REAL_DEVICES[device_id]["name"],
                "on": is_on,
                "type": REAL_DEVICES[device_id]["type"]
            }
        except Exception as e:
            logger.error(f"'{device_id}' status reading failed: {e}")
            response_state[device_id] = {
                "name": REAL_DEVICES[device_id]["name"] + " (ERROR: Offline)",
                "on": False,
                "type": REAL_DEVICES[device_id]["type"]
            }
            
    return response_state

@router.post("/{device_id}")
async def control_device(device_id: str, control: DeviceControl):
    """Turns a specific real device on or off."""
    
    if device_id not in tapo_device_objects:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found or offline.")

    device = tapo_device_objects[device_id]
    
    try:
        if control.on:
            await device.on()
        else:
            await device.off()
        
        logger.info(f"Real device '{device_id}' status set to: {control.on}")
        
        return {
            "name": REAL_DEVICES[device_id]["name"],
            "on": control.on,
            "type": REAL_DEVICES[device_id]["type"]
        }
    except Exception as e:
        logger.error(f"'{device_id}' control failed: {e}")
        raise HTTPException(status_code=500, detail="Device communication failed.")