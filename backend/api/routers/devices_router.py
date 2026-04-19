from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv
import logging
from sqlmodel import Session, select
from database.settings import engine

from database.models import Device
from api.drivers import tapo_driver
from api.services.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/devices", tags=["Devices"])

load_dotenv(override=True)

TAPO_USERNAME = os.getenv("TAPO_USERNAME")
TAPO_PASSWORD = os.getenv("TAPO_PASSWORD")

CONNECTED_DEVICES: Dict[str, Any] = {}

class DeviceControl(BaseModel):
    on: bool

class BrightnessControl(BaseModel):
    brightness: int 

class ColorControl(BaseModel):
    hue: int  
    saturation: int  

async def ensure_connection(device_id: str) -> bool:
    """It retrieves the device's IP address from the database and attempts to connect."""

    with Session(engine) as session:
        db_device = session.exec(select(Device).where(Device.name == device_id)).first()
        if not db_device or not db_device.ip_address: 
            return False
        
        ip = db_device.ip_address
        protocol = db_device.protocol

    if protocol == "tapo":
        try:
            if device_id in CONNECTED_DEVICES:
                del CONNECTED_DEVICES[device_id]
            logger.info(f"'{device_id}' ({ip}) is connecting...")
            device_obj = await tapo_driver.connect_tapo_device(ip, TAPO_USERNAME, TAPO_PASSWORD)
            if device_obj:
                CONNECTED_DEVICES[device_id] = {"protocol": "tapo", "object": device_obj, "type": "outlet"}
                return True
        except Exception as e:
            logger.error(f"'{device_id}' connection failed: {e}")
            
    elif protocol == "tapo_bulb":
        try:
            if device_id in CONNECTED_DEVICES:
                del CONNECTED_DEVICES[device_id]
            logger.info(f"Bulb '{device_id}' ({ip}) is connecting...")
            device_obj = await tapo_driver.connect_tapo_bulb(ip, TAPO_USERNAME, TAPO_PASSWORD)
            if device_obj:
                CONNECTED_DEVICES[device_id] = {"protocol": "tapo_bulb", "object": device_obj, "type": "bulb"}
                return True
        except Exception as e:
            logger.error(f"Bulb '{device_id}' connection failed: {e}")
    
    return False

async def initialize_devices():
    logger.info("Device Manager: Bulk DB startup...")

    with Session(engine) as session:
        devices = session.exec(select(Device).where(Device.device_type.in_(["outlet", "bulb"]))).all()
        for d in devices:
            await ensure_connection(d.name)

@router.get("/")
async def get_all_devices() -> Dict[str, dict]:
    response_state = {}
    
    with Session(engine) as session:
        db_devices = session.exec(select(Device).where(Device.device_type.in_(["outlet", "bulb"]))).all()

    for db_device in db_devices:
        device_id = db_device.name
        device_type = db_device.device_type
        human_name = getattr(db_device, "display_name", device_id)
        
        is_online, is_on, current_power = False, False, 0.0
        bulb_brightness, bulb_hue, bulb_saturation = 100, 0, 0
        active_conn = None

        if device_id not in CONNECTED_DEVICES:
            await ensure_connection(device_id)

        if device_id in CONNECTED_DEVICES:
            conn = CONNECTED_DEVICES[device_id]
            if conn["protocol"] == "tapo":
                status = await tapo_driver.get_tapo_status(conn["object"])
                if not status["error"]:
                    is_online, is_on, active_conn = True, status["on"], conn
            elif conn["protocol"] == "tapo_bulb":
                status = await tapo_driver.get_bulb_status(conn["object"])
                if not status["error"]:
                    is_online, is_on, active_conn = True, status["on"], conn
                    bulb_brightness, bulb_hue, bulb_saturation = status.get("brightness", 100), status.get("hue", 0), status.get("saturation", 0)

        if is_online and active_conn and device_type == "outlet":
            try:
                power_data = await active_conn["object"].get_current_power()
                current_power = power_data.to_dict().get("current_power", 0) / 1000
            except Exception:
                current_power = 0.0

        if is_online:
            device_response = {"name": human_name, "on": is_on, "type": device_type, "power": round(current_power, 2)}
            if device_type == "bulb":
                device_response.update({"brightness": bulb_brightness, "hue": bulb_hue, "saturation": bulb_saturation})
            response_state[device_id] = device_response
        else:
            device_response = {"name": f"{human_name} (Offline)", "on": False, "type": device_type, "power": 0.0}
            if device_type == "bulb":
                device_response.update({"brightness": 0, "hue": 0, "saturation": 0})
            response_state[device_id] = device_response
            
    return response_state

@router.post("/{device_id}")
async def control_device(device_id: str, control: DeviceControl):
    if device_id not in CONNECTED_DEVICES:
        if not await ensure_connection(device_id):
             raise HTTPException(status_code=503, detail=f"Device '{device_id}' is offline.")

    conn = CONNECTED_DEVICES[device_id]
    try:
        if conn["protocol"] == "tapo":
            await tapo_driver.set_tapo_status(conn["object"], control.on)
        elif conn["protocol"] == "tapo_bulb":
            await tapo_driver.set_bulb_status(conn["object"], control.on)

        await manager.broadcast_json({"status": "device_update", "device_id": device_id, "data": {"on": control.on, "type": conn["type"]}})
        return {"device_id": device_id, "on": control.on, "success": True}
    except Exception as e:
        logger.warning(f"Self-healing: Retrying connection for {device_id}...")
        if await ensure_connection(device_id):
            conn = CONNECTED_DEVICES[device_id]
            if conn["protocol"] == "tapo": await tapo_driver.set_tapo_status(conn["object"], control.on)
            elif conn["protocol"] == "tapo_bulb": await tapo_driver.set_bulb_status(conn["object"], control.on)
            await manager.broadcast_json({"status": "device_update", "device_id": device_id, "data": {"on": control.on, "type": conn["type"]}})
            return {"device_id": device_id, "on": control.on, "success": True}
        raise HTTPException(status_code=503, detail=f"Device '{device_id}' reconnect failed.")

@router.post("/{device_id}/brightness")
async def set_brightness(device_id: str, control: BrightnessControl):
    if device_id not in CONNECTED_DEVICES:
        if not await ensure_connection(device_id): raise HTTPException(status_code=503, detail="Offline")
    
    conn = CONNECTED_DEVICES[device_id]
    if conn["type"] != "bulb": raise HTTPException(status_code=400, detail="Not a bulb")
    
    try:
        await tapo_driver.set_bulb_brightness(conn["object"], control.brightness)
        await manager.broadcast_json({"status": "device_update", "device_id": device_id, "data": {"brightness": control.brightness}})
        return {"device_id": device_id, "success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Action failed")

@router.post("/{device_id}/color")
async def set_color(device_id: str, control: ColorControl):
    if device_id not in CONNECTED_DEVICES:
        if not await ensure_connection(device_id): raise HTTPException(status_code=503, detail="Offline")
    
    conn = CONNECTED_DEVICES[device_id]
    if conn["type"] != "bulb": raise HTTPException(status_code=400, detail="Not a bulb")
    
    try:
        await tapo_driver.set_bulb_color(conn["object"], control.hue, control.saturation)
        await manager.broadcast_json({"status": "device_update", "device_id": device_id, "data": {"hue": control.hue, "saturation": control.saturation, "on": True}})
        return {"device_id": device_id, "success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Action failed")

@router.get("/{device_id}/status")
async def get_bulb_status(device_id: str):
    if device_id not in CONNECTED_DEVICES:
        if not await ensure_connection(device_id): raise HTTPException(status_code=503, detail="Offline")
    
    conn = CONNECTED_DEVICES[device_id]
    if conn["type"] != "bulb": raise HTTPException(status_code=400, detail="Not a bulb")
    
    try:
        status = await tapo_driver.get_bulb_status(conn["object"])
        if status["error"]: raise HTTPException(status_code=503, detail="Offline")
        return {
            "device_id": device_id, "on": status["on"], "brightness": status["brightness"],
            "hue": status["hue"], "saturation": status["saturation"]
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Status fetch failed")