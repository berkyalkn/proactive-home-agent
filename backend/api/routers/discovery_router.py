from fastapi import APIRouter, Depends
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