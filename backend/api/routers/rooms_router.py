from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database.settings import engine
from database.models import Room, User
from api.routers.auth_router import get_current_user

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.get("/list")
def list_my_rooms(current_user: User = Depends(get_current_user)):
    """The system retrieves the rooms in the homeowner's house after they log in."""
    
    with Session(engine) as session:
        my_rooms = session.exec(
            select(Room).where(Room.owner_id == current_user.id)
        ).all()
        
        rooms_data = [
            {
                "id": r.room_key,
                "name": r.display_name,
                "icon": r.icon_name
            }
            for r in my_rooms
        ]
        
        return {"rooms": rooms_data}