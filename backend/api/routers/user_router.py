from fastapi import APIRouter, UploadFile, Form, File, HTTPException, Depends
from typing import Optional
from sqlmodel import Session, select
from api.services.speaker_service import speaker_service
from api.services.vision_service import vision_service
from api.routers.auth_router import get_current_user
from database.models import User
from database.settings import engine 
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
async def register_user(
    current_user: User = Depends(get_current_user), 
    audio_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None)
):
    """
    Receives audio recording and/or facial image from the frontend.
    Identity is autonomously verified via JWT Token.
    """
    username = current_user.username
    logger.info(f"Biometric Registration Initiated for: {username}")
    
    if not audio_file and not image_file:
        raise HTTPException(status_code=400, detail="Must provide at least an audio or image file.")

    results = []

    if audio_file:
        try:
            audio_bytes = await audio_file.read()
            if audio_bytes:
                speaker_service.register_user(username, audio_bytes)
                results.append("voice")
        except Exception as e:
            logger.error(f"Voice Registration Error: {e}")
            raise HTTPException(status_code=500, detail=f"Voice Error: {str(e)}")

    if image_file:
        try:
            image_bytes = await image_file.read()
            if image_bytes:
                vision_service.register_face(username, image_bytes)
                results.append("face")
        except Exception as e:
            logger.error(f"Face Registration Error: {e}")
            raise HTTPException(status_code=400, detail=f"Face Error: {str(e)}")

    return {"status": "success", "message": f"User '{username}' registered successfully with: {', '.join(results)}"}


@router.post("/add-guest")
async def add_guest(
    current_user: User = Depends(get_current_user), 
    name: str = Form(...), 
    audio_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None)
):
    guest_name = name.strip()
    logger.info(f"Homeowner '{current_user.username}' is adding guest: '{guest_name}'")

    if not audio_file and not image_file:
        raise HTTPException(status_code=400, detail="Must provide at least an audio or image file.")

    with Session(engine) as session:
        existing_user = session.exec(select(User).where(User.username == guest_name)).first()
        if not existing_user:
            new_guest = User(
                username=guest_name,
                role="guest",
                owner_id=current_user.id, 
                hashed_password="not-a-real-password-guest-account" 
            )
            session.add(new_guest)
            session.commit()

    results = []

    if audio_file:
        try:
            audio_bytes = await audio_file.read()
            if audio_bytes:
                speaker_service.register_user(guest_name, audio_bytes)
                results.append("voice")
        except Exception as e:
            logger.error(f"Voice Registration Error: {e}")
            raise HTTPException(status_code=500, detail=f"Voice Error: {str(e)}")

    if image_file:
        try:
            image_bytes = await image_file.read()
            if image_bytes:
                vision_service.register_face(guest_name, image_bytes)
                results.append("face")
        except Exception as e:
            logger.error(f"Face Registration Error: {e}")
            raise HTTPException(status_code=400, detail=f"Face Error: {str(e)}")

    return {"status": "success", "message": f"Guest '{guest_name}' added to {current_user.username}'s home."}


@router.delete("/{username}")
def delete_user(username: str, current_user: User = Depends(get_current_user)):
    """Deletes the user from Speaker, Vision memory and Database."""
    try:
        speaker_service.delete_user(username)
        if username in vision_service.known_faces:
             del vision_service.known_faces[username]
             
        with Session(engine) as session:
            user_to_delete = session.exec(select(User).where(User.username == username)).first()
            if user_to_delete:
                session.delete(user_to_delete)
                session.commit()

        return {"status": "success", "message": f"User {username} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
def list_users(current_user: User = Depends(get_current_user)):
    """Lists registered usernames from Database."""

    with Session(engine) as session:
        authorized_entities = session.exec(
            select(User)
            .where(
                (User.id == current_user.id) | (User.owner_id == current_user.id)
            )
            .where(
                (User.face_embedding != None) | (User.voice_embedding != None)
            )
        ).all()
        
        user_list = [u.username for u in authorized_entities]
        return {"users": user_list}