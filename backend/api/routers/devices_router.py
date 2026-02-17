from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv
import logging

from api.drivers import tapo_driver
from api.services.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devices", tags=["Devices"])
load_dotenv()

DEVICE_REGISTRY = {
    "living_room_plug1": {
        "name": "Plug1 (Oven)",
        "type": "outlet",
        "protocol": "tapo",
        "ip_env": "PLUG1_OVEN_IP"
    },
    "living_room_plug2": {
        "name": "Plug2 (Desk Lamp)",
        "type": "outlet",
        "protocol": "tapo",
        "ip_env": "PLUG2_DESKLAMP_IP"
    },
    "living_room_bulb": {
        "name": "Living Room Bulb",
        "type": "bulb",
        "protocol": "tapo_bulb",
        "ip_env": "LIVING_ROOM_BULB_IP"
    },
    "bedroom_bulb": {
        "name": "Bedroom Bulb",
        "type": "bulb",
        "protocol": "tapo_bulb",
        "ip_env": "BEDROOM_BULB_IP"
    }

}

TAPO_USERNAME = os.getenv("TAPO_USERNAME")
TAPO_PASSWORD = os.getenv("TAPO_PASSWORD")

CONNECTED_DEVICES: Dict[str, Any] = {}

class DeviceControl(BaseModel):
    on: bool


class BulbControl(BaseModel):
    on: bool
    brightness: int | None = None
    hue: int | None = None
    saturation: int | None = None


class BrightnessControl(BaseModel):
    brightness: int 


class ColorControl(BaseModel):
    hue: int  
    saturation: int  




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
    
    elif config["protocol"] == "tapo_bulb":
        try:
            if device_id in CONNECTED_DEVICES:
                del CONNECTED_DEVICES[device_id]
            
            logger.info(f"Bulb '{device_id}' ({ip}) is connecting...")
            device_obj = await tapo_driver.connect_tapo_bulb(ip, TAPO_USERNAME, TAPO_PASSWORD)
            
            if device_obj:
                CONNECTED_DEVICES[device_id] = {"protocol": "tapo_bulb", "object": device_obj}
                logger.info(f"Bulb '{device_id}' is connected.")
                return True
        except Exception as e:
            logger.error(f"Bulb '{device_id}' connection failed: {e}")
    
    return False

async def initialize_devices():
    logger.info("Device Manager: Bulk startup...")
    for device_id in DEVICE_REGISTRY:
        await ensure_connection(device_id)


@router.get("/")
async def get_all_devices() -> Dict[str, dict]:

    response_state = {}
    
    for device_id, config in DEVICE_REGISTRY.items():
        is_online = False
        is_on = False
        current_power = 0.0
        bulb_brightness = 100
        bulb_hue = 0
        bulb_saturation = 0
        
        active_conn = None

        if device_id in CONNECTED_DEVICES:
            conn = CONNECTED_DEVICES[device_id]
            if conn["protocol"] == "tapo":
                status = await tapo_driver.get_tapo_status(conn["object"])
                if not status["error"]:
                    is_online = True
                    is_on = status["on"]
                    active_conn = conn
            elif conn["protocol"] == "tapo_bulb":
                status = await tapo_driver.get_bulb_status(conn["object"])
                if not status["error"]:
                    is_online = True
                    is_on = status["on"]
                    active_conn = conn
                    bulb_brightness = status.get("brightness", 100)
                    bulb_hue = status.get("hue", 0)
                    bulb_saturation = status.get("saturation", 0)

        if not is_online:
            if await ensure_connection(device_id):
                conn = CONNECTED_DEVICES[device_id]
                if conn["protocol"] == "tapo":
                    status = await tapo_driver.get_tapo_status(conn["object"])
                    if not status["error"]:
                        is_online = True
                        is_on = status["on"]
                        active_conn = conn
                elif conn["protocol"] == "tapo_bulb":
                    status = await tapo_driver.get_bulb_status(conn["object"])
                    if not status["error"]:
                        is_online = True
                        is_on = status["on"]
                        active_conn = conn
                        bulb_brightness = status.get("brightness", 100)
                        bulb_hue = status.get("hue", 0)
                        bulb_saturation = status.get("saturation", 0) 

        if is_online and active_conn and config["protocol"] == "tapo":
            try:
                power_data = await active_conn["object"].get_current_power()
                current_power = power_data.to_dict().get("current_power", 0) / 1000
            except Exception as e:
                logger.warning(f"Failed to read power data ({device_id}): {e}")
                current_power = 0.0

        if is_online:
            device_response = {
                "name": config["name"],
                "on": is_on,
                "type": config["type"],
                "power": round(current_power, 2)
            }
            if config["type"] == "bulb":
                device_response["brightness"] = bulb_brightness
                device_response["hue"] = bulb_hue
                device_response["saturation"] = bulb_saturation
            response_state[device_id] = device_response
        else:
            device_response = {
                "name": f"{config['name']} (Offline)",
                "on": False,
                "type": config["type"],
                "power": 0.0
            }
            if config["type"] == "bulb":
                device_response["brightness"] = 0
                device_response["hue"] = 0
                device_response["saturation"] = 0
            response_state[device_id] = device_response
            
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
        elif conn["protocol"] == "tapo_bulb":
            await tapo_driver.set_bulb_status(conn["object"], control.on)
        
        logger.info(f"Device '{device_id}' set to: {control.on}")

        await manager.broadcast_json({
            "status": "device_update",
            "device_id": device_id,
            "data": {
                "on": control.on,
                "type": DEVICE_REGISTRY[device_id]["type"]
            }
        })


        return {"name": DEVICE_REGISTRY[device_id]["name"], "on": control.on, "type": DEVICE_REGISTRY[device_id]["type"]}

    except Exception as e:
        logger.warning(f"First attempt failed ({e}). Self-healing is in effect...")
        
        if await ensure_connection(device_id):
            try:
                conn = CONNECTED_DEVICES[device_id]
                if conn["protocol"] == "tapo":
                    await tapo_driver.set_tapo_status(conn["object"], control.on)
                elif conn["protocol"] == "tapo_bulb":
                    await tapo_driver.set_bulb_status(conn["object"], control.on)

                await manager.broadcast_json({
                    "status": "device_update",
                    "device_id": device_id,
                    "data": { "on": control.on, "type": DEVICE_REGISTRY[device_id]["type"] }
                })
                
                logger.info(f"Second attempt successful! Device '{device_id}' set to: {control.on}")

                return {"name": DEVICE_REGISTRY[device_id]["name"], "on": control.on, "type": DEVICE_REGISTRY[device_id]["type"]}
            except Exception as e2:
                logger.error(f"Second attempt failed: {e2}")
                raise HTTPException(status_code=500, detail=f"Device '{device_id}' connection failed.")
        else:
             raise HTTPException(status_code=503, detail=f"Device '{device_id}' cannot be reconnected.")


@router.post("/{device_id}/brightness")
async def set_brightness(device_id: str, control: BrightnessControl):
    """
    Sets the brightness of a smart bulb (1-100).
    """
    if device_id not in DEVICE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found.")
    
    config = DEVICE_REGISTRY[device_id]
    if config["type"] != "bulb":
        raise HTTPException(status_code=400, detail=f"Device '{device_id}' is not a bulb.")
    
    if device_id not in CONNECTED_DEVICES:
        if not await ensure_connection(device_id):
            raise HTTPException(status_code=503, detail=f"Device '{device_id}' is not reachable (Offline).")
    
    try:
        conn = CONNECTED_DEVICES[device_id]
        await tapo_driver.set_bulb_brightness(conn["object"], control.brightness)

        await manager.broadcast_json({
            "status": "device_update",
            "device_id": device_id,
            "data": { "brightness": control.brightness }
        })

        logger.info(f"Bulb '{device_id}' brightness set to: {control.brightness}%")
        return {"device_id": device_id, "brightness": control.brightness, "success": True}
    except Exception as e:
        logger.warning(f"Brightness control failed ({e}). Retrying...")
        if await ensure_connection(device_id):
            try:
                conn = CONNECTED_DEVICES[device_id]
                await tapo_driver.set_bulb_brightness(conn["object"], control.brightness)
                
                await manager.broadcast_json({
                    "status": "device_update",
                    "device_id": device_id,
                    "data": { "brightness": control.brightness }
                
                })
                return {"device_id": device_id, "brightness": control.brightness, "success": True}
            except Exception as e2:
                logger.error(f"Second attempt failed: {e2}")
                raise HTTPException(status_code=500, detail=f"Brightness control failed.")
        raise HTTPException(status_code=503, detail=f"Device '{device_id}' cannot be reconnected.")


@router.post("/{device_id}/color")
async def set_color(device_id: str, control: ColorControl):
    """
    Sets the color of a smart bulb (hue: 0-360, saturation: 0-100).
    """
    if device_id not in DEVICE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found.")
    
    config = DEVICE_REGISTRY[device_id]
    if config["type"] != "bulb":
        raise HTTPException(status_code=400, detail=f"Device '{device_id}' is not a bulb.")
    
    if device_id not in CONNECTED_DEVICES:
        if not await ensure_connection(device_id):
            raise HTTPException(status_code=503, detail=f"Device '{device_id}' is not reachable (Offline).")
    
    try:
        conn = CONNECTED_DEVICES[device_id]
        await tapo_driver.set_bulb_color(conn["object"], control.hue, control.saturation)

        await manager.broadcast_json({
            "status": "device_update",
            "device_id": device_id,
            "data": { 
                "hue": control.hue, 
                "saturation": control.saturation,
                "on": True 
            }
        })

        logger.info(f"Bulb '{device_id}' color set to: hue={control.hue}, saturation={control.saturation}")
        return {"device_id": device_id, "hue": control.hue, "saturation": control.saturation, "success": True}
    except Exception as e:
        logger.warning(f"Color control failed ({e}). Retrying...")
        if await ensure_connection(device_id):
            try:
                conn = CONNECTED_DEVICES[device_id]
                await tapo_driver.set_bulb_color(conn["object"], control.hue, control.saturation)

                await manager.broadcast_json({
                    "status": "device_update",
                    "device_id": device_id,
                    "data": { "hue": control.hue, "saturation": control.saturation, "on": True }
                })
                
                return {"device_id": device_id, "hue": control.hue, "saturation": control.saturation, "success": True}
            except Exception as e2:
                logger.error(f"Second attempt failed: {e2}")
                raise HTTPException(status_code=500, detail=f"Color control failed.")
        raise HTTPException(status_code=503, detail=f"Device '{device_id}' cannot be reconnected.")


@router.get("/{device_id}/status")
async def get_bulb_status(device_id: str):
    """
    Gets the detailed status of a smart bulb (for UI synchronization).
    """
    if device_id not in DEVICE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found.")
    
    config = DEVICE_REGISTRY[device_id]
    if config["type"] != "bulb":
        raise HTTPException(status_code=400, detail=f"Device '{device_id}' is not a bulb.")
    
    if device_id not in CONNECTED_DEVICES:
        if not await ensure_connection(device_id):
            raise HTTPException(status_code=503, detail=f"Device '{device_id}' is not reachable (Offline).")
    
    try:
        conn = CONNECTED_DEVICES[device_id]
        status = await tapo_driver.get_bulb_status(conn["object"])
        if status["error"]:
            raise HTTPException(status_code=503, detail="Bulb is offline.")
        return {
            "device_id": device_id,
            "name": config["name"],
            "on": status["on"],
            "brightness": status["brightness"],
            "hue": status["hue"],
            "saturation": status["saturation"],
            "color_temp": status["color_temp"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get bulb status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get bulb status.")