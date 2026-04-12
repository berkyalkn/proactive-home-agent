from fastapi import APIRouter, UploadFile, Form, File, HTTPException, Depends
from typing import Optional
from api.services.speaker_service import speaker_service
from api.services.vision_service import vision_service
from api.routers.auth_router import get_current_user
from database.models import User
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


@router.delete("/{username}")
def delete_user(username: str):
    """Deletes the user from both Speaker and Vision memory (DB handles cascade)."""
    try:
        speaker_service.delete_user(username)
        
        if username in vision_service.known_faces:
             del vision_service.known_faces[username]
             
        return {"status": "success", "message": f"User {username} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
def list_users():
    """Lists registered usernames from both services."""
    
    all_users = set(speaker_service.known_users.keys()).union(set(vision_service.known_faces.keys()))
    return {"users": list(all_users)}