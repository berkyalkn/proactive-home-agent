from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import os
from dotenv import load_dotenv
import logging

from api.drivers import tapo_driver

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devices", tags=["Devices"])
load_dotenv()

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

TAPO_USERNAME = os.getenv("TAPO_USERNAME")
TAPO_PASSWORD = os.getenv("TAPO_PASSWORD")

CONNECTED_DEVICES: Dict[str, Any] = {}

class DeviceControl(BaseModel):
    on: bool

async def ensure_connection(device_id: str) -> bool:
    """Tries to connect to a device or renews the connection."""
    config = DEVICE_REGISTRY.get(device_id)
    if not config: return False
    
    ip = os.getenv(config.get("ip_env"))
    if not ip: return False

    if config["protocol"] == "tapo":
        try:
            if device_id in CONNECTED_DEVICES:
                del CONNECTED_DEVICES[device_id]
            
            logger.info(f"'{device_id}' ({ip}) is reconnecting...")
            device_obj = await tapo_driver.connect_tapo_device(ip, TAPO_USERNAME, TAPO_PASSWORD)
            
            if device_obj:
                CONNECTED_DEVICES[device_id] = {"protocol": "tapo", "object": device_obj}
                logger.info(f"'{device_id}' is reconnected.")
                return True
        except Exception as e:
            logger.error(f"'{device_id}' connection failed: {e}")
    
    return False

async def initialize_devices():
    logger.info("Device Manager: Bulk startup...")
    for device_id in DEVICE_REGISTRY:
        await ensure_connection(device_id)


@router.get("/")
async def get_all_devices() -> Dict[str, dict]:
    """
    Returns all devices. If an error occurs, it automatically retries (retry).
    """
    response_state = {}
    
    for device_id, config in DEVICE_REGISTRY.items():
        is_online = False
        is_on = False
        
        if device_id in CONNECTED_DEVICES:
            conn = CONNECTED_DEVICES[device_id]
            if conn["protocol"] == "tapo":
                status = await tapo_driver.get_tapo_status(conn["object"])
                
                if not status["error"]:
                    is_online = True
                    is_on = status["on"]
                else:
                
                    if await ensure_connection(device_id):
                        new_conn = CONNECTED_DEVICES[device_id]
                        new_status = await tapo_driver.get_tapo_status(new_conn["object"])
                        if not new_status["error"]:
                            is_online = True
                            is_on = new_status["on"]

        elif await ensure_connection(device_id):
             new_conn = CONNECTED_DEVICES[device_id]
             new_status = await tapo_driver.get_tapo_status(new_conn["object"])
             if not new_status["error"]:
                is_online = True
                is_on = new_status["on"]

        if is_online:
            response_state[device_id] = {
                "name": config["name"],
                "on": is_on,
                "type": config["type"]
            }
        else:
            response_state[device_id] = {
                "name": f"{config['name']} (Offline)",
                "on": False,
                "type": config["type"]
            }
            
    return response_state

@router.post("/{device_id}")
async def control_device(device_id: str, control: DeviceControl):
    """
    Controls a device. If an error occurs (SessionTimeout, etc.), it automatically reconnects and retries (Self-Healing).
    """
    if device_id not in DEVICE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found.")

    if device_id not in CONNECTED_DEVICES:
        if not await ensure_connection(device_id):
             raise HTTPException(status_code=503, detail=f"Device '{device_id}' is not reachable (Offline).")

    try:
        conn = CONNECTED_DEVICES[device_id]
        if conn["protocol"] == "tapo":
            await tapo_driver.set_tapo_status(conn["object"], control.on)
        
        logger.info(f"Device '{device_id}' set to: {control.on}")
        return {"name": DEVICE_REGISTRY[device_id]["name"], "on": control.on, "type": DEVICE_REGISTRY[device_id]["type"]}

    except Exception as e:
        logger.warning(f"First attempt failed ({e}). Self-healing is in effect...")
        
        if await ensure_connection(device_id):
            try:
                conn = CONNECTED_DEVICES[device_id]
                if conn["protocol"] == "tapo":
                    await tapo_driver.set_tapo_status(conn["object"], control.on)
                
                logger.info(f"Second attempt successful! Device '{device_id}' set to: {control.on}")
                return {"name": DEVICE_REGISTRY[device_id]["name"], "on": control.on, "type": DEVICE_REGISTRY[device_id]["type"]}
            except Exception as e2:
                logger.error(f"Second attempt failed: {e2}")
                raise HTTPException(status_code=500, detail=f"Device '{device_id}' connection failed.")
        else:
             raise HTTPException(status_code=503, detail=f"Device '{device_id}' cannot be reconnected.")