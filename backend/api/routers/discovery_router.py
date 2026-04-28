from fastapi import APIRouter, Depends, HTTPException
from api.services.discovery_service import discovery_service
from api.routers.auth_router import get_current_user
from database.models import User, Device
from sqlmodel import Session, select
from database.settings import engine

router = APIRouter(prefix="/discovery", tags=["Discovery"])

@router.get("/scan")
async def scan_network(current_user=Depends(get_current_user)):
    raw_devices = await discovery_service.scan_network()
    
    with Session(engine) as session:
        registered_devices = session.exec(select(Device)).all()
        registered_ids = {d.name for d in registered_devices} 
        
    filtered_devices = [
        dev for dev in raw_devices 
        if dev["id"] not in registered_ids
    ]
    
    return {"discovered_devices": filtered_devices}


@router.post("/identify/{device_id}")
async def identify_device(device_id: str, current_user=Depends(get_current_user)):
    """
    The device sends a momentary trigger (Blink/Click) to reveal its location.
    """

    success = await discovery_service.ping_device_for_identification(device_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not reach the device to identify.")
    
    return {"message": "Identity ping sent"}