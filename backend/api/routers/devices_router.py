from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv
import logging
from sqlmodel import Session, select
from database.settings import engine
import asyncio

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
    """It retrieves the device's IP address from the database and attempts to connect, cleaning up old sessions."""

    with Session(engine) as session:
        db_device = session.exec(select(Device).where(Device.name == device_id)).first()
        if not db_device or not db_device.ip_address: 
            return False
        
        ip, protocol = db_device.ip_address, db_device.protocol

    if device_id in CONNECTED_DEVICES:
        try:
            old_conn = CONNECTED_DEVICES[device_id].get("object")
            if old_conn and hasattr(old_conn, 'logout'):
                await asyncio.wait_for(old_conn.logout(), timeout=1.0)
        except Exception:
            pass
        del CONNECTED_DEVICES[device_id]

    try:
        if protocol == "tapo":
            device_obj = await tapo_driver.connect_tapo_device(ip, TAPO_USERNAME, TAPO_PASSWORD)
            if device_obj:
                CONNECTED_DEVICES[device_id] = {"protocol": "tapo", "object": device_obj, "type": "outlet"}
                return True
        elif protocol == "tapo_bulb":
            device_obj = await tapo_driver.connect_tapo_bulb(ip, TAPO_USERNAME, TAPO_PASSWORD)
            if device_obj:
                CONNECTED_DEVICES[device_id] = {"protocol": "tapo_bulb", "object": device_obj, "type": "bulb"}
                return True
    except Exception as e:
        logger.error(f"'{device_id}' connection failed: {e}")
    return False

async def get_active_connection(device_id: str) -> Any:
    """Check if the device session is active; if not, reconnect."""

    conn = CONNECTED_DEVICES.get(device_id)
    if not conn:
        if not await ensure_connection(device_id):
            return None
        conn = CONNECTED_DEVICES.get(device_id)
    
    if not await tapo_driver.is_session_active(conn["object"]):
        logger.warning(f"Session expired for {device_id}. Refreshing...")
        if not await ensure_connection(device_id):
            return None
        conn = CONNECTED_DEVICES.get(device_id)
    
    return conn["object"]

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
        conn = await get_active_connection(device_id)
        
        is_online, is_on, power, bright, hue, sat = False, False, 0.0, 100, 0, 0
        
        if conn:
            try:
                if db_device.device_type == "outlet":
                    status = await asyncio.wait_for(tapo_driver.get_tapo_status(conn), timeout=1.5)
                    power_data = await asyncio.wait_for(conn.get_current_power(), timeout=1.0)
                    is_online, is_on = True, status["on"]
                    power = power_data.to_dict().get("current_power", 0) / 1000
                else:
                    status = await asyncio.wait_for(tapo_driver.get_bulb_status(conn), timeout=1.5)
                    is_online, is_on = True, status["on"]
                    bright, hue, sat = status["brightness"], status["hue"], status["saturation"]
            except Exception:
                logger.warning(f"Status check failed for {device_id}")

        res = {"name": getattr(db_device, "display_name", device_id), "on": is_on, "type": db_device.device_type, "online": is_online}
        if db_device.device_type == "outlet": res.update({"power": round(power, 2)})
        else: res.update({"brightness": bright, "hue": hue, "saturation": sat})
        response_state[device_id] = res
            
    return response_state

@router.post("/{device_id}")
async def control_device(device_id: str, control: DeviceControl):
    conn = await get_active_connection(device_id)
    if not conn: raise HTTPException(status_code=503, detail="Device offline")
    
    try:
        if "bulb" in CONNECTED_DEVICES[device_id]["protocol"]:
            await tapo_driver.set_bulb_status(conn, control.on)
        else:
            await tapo_driver.set_tapo_status(conn, control.on)
        await manager.broadcast_json({"status": "device_update", "device_id": device_id, "data": {"on": control.on}})
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Action failed")

@router.post("/{device_id}/brightness")
async def set_brightness(device_id: str, control: BrightnessControl):
    conn = await get_active_connection(device_id)
    if not conn: raise HTTPException(status_code=503, detail="Offline")
    
    try:
        await tapo_driver.set_bulb_brightness(conn, control.brightness)
        await manager.broadcast_json({"status": "device_update", "device_id": device_id, "data": {"brightness": control.brightness}})
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Action failed")

@router.post("/{device_id}/color")
async def set_color(device_id: str, control: ColorControl):
    conn = await get_active_connection(device_id)
    if not conn: raise HTTPException(status_code=503, detail="Offline")
    
    try:
        await tapo_driver.set_bulb_color(conn, control.hue, control.saturation)
        await manager.broadcast_json({"status": "device_update", "device_id": device_id, "data": {"hue": control.hue, "saturation": control.saturation}})
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Action failed")

@router.get("/{device_id}/status")
async def get_bulb_status(device_id: str):
    conn = await get_active_connection(device_id)
    if not conn: raise HTTPException(status_code=503, detail="Offline")
    
    try:
        status = await tapo_driver.get_bulb_status(conn)
        return {"on": status["on"], "brightness": status["brightness"], "hue": status["hue"], "saturation": status["saturation"]}
    except Exception:
        raise HTTPException(status_code=500, detail="Status fetch failed")