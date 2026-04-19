from fastapi import APIRouter, Depends
from api.services.discovery_service import discovery_service
from api.routers.auth_router import get_current_user
from database.models import User

router = APIRouter(prefix="/discovery", tags=["Discovery"])

@router.get("/scan")
async def scan_devices(current_user: User = Depends(get_current_user)):
    """
    It finds unassigned devices on the user's network.
    """
    
    found_devices = await discovery_service.scan_network()
    
    return {"status": "success", "discovered_devices": found_devices}