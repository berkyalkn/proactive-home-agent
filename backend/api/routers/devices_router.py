from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import os
from dotenv import load_dotenv
import logging

from api.drivers import tapo_driver

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devices", tags=["Devices (Real & Abstracted)"])
load_dotenv()

TAPO_USERNAME = os.getenv("TAPO_USERNAME")
TAPO_PASSWORD = os.getenv("TAPO_PASSWORD")


DEVICE_REGISTRY = {
    "living_room_light": {
        "name": "Living Room Light",
        "type": "light",
        "protocol": "tapo", 
        "ip_env": "LIVING_ROOM_LIGHT_IP" 
    },
    "bedroom_light": {
        "name": "Bedroom Light",
        "type": "light",
        "protocol": "tapo",
        "ip_env": "BEDROOM_LIGHT_IP"
    }
 
}

CONNECTED_DEVICES: Dict[str, Any] = {}

async def initialize_devices():
    """Reads the device registry and connects to all devices using their respective drivers."""
    logger.info("Device Manager: Devices are starting...")

    for device_id, config in DEVICE_REGISTRY.items():
        protocol = config.get("protocol")
        ip = os.getenv(config.get("ip_env"))

        if not ip:
            logger.warning(f"'{device_id}' IP address not found in the .env file. Skipping.")
            continue

        if protocol == "tapo":
            device_obj = await tapo_driver.connect_tapo_device(ip, TAPO_USERNAME, TAPO_PASSWORD)
            if device_obj:
                CONNECTED_DEVICES[device_id] = {"protocol": "tapo", "object": device_obj}


class DeviceControl(BaseModel):
    on: bool


@router.get("/")
async def get_all_devices() -> Dict[str, dict]:
    """Gets the current state of all *connected* devices from their respective drivers."""
    
    response_state = {}
    
    for device_id, conn in CONNECTED_DEVICES.items():
        base_config = DEVICE_REGISTRY[device_id]
        
        if conn["protocol"] == "tapo":
            status = await tapo_driver.get_tapo_status(conn["object"])
            
            response_state[device_id] = {
                "name": base_config["name"] + (" (ERROR: Offline)" if status["error"] else ""),
                "on": status["on"],
                "type": base_config["type"]
            }

    return response_state




@router.post("/{device_id}")
async def control_device(device_id: str, control: DeviceControl):
    """Controls a device (independent of the protocol) using its respective driver."""
    
    if device_id not in CONNECTED_DEVICES:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found or offline.")

    conn = CONNECTED_DEVICES[device_id]
    base_config = DEVICE_REGISTRY[device_id]
    
    try:
        if conn["protocol"] == "tapo":
            await tapo_driver.set_tapo_status(conn["object"], control.on)
        
   
        else:
            raise HTTPException(status_code=500, detail="Unknown device protocol")

        logger.info(f"Device '{device_id}' status set to: {control.on}")
        
        return {
            "name": base_config["name"],
            "on": control.on,
            "type": base_config["type"]
        }
    except Exception as e:
        logger.error(f"'{device_id}' control failed: {e}")
        raise HTTPException(status_code=500, detail="Device communication failed.")