from fastapi import APIRouter, UploadFile, Form, File, HTTPException
from typing import Optional
from api.services.speaker_service import speaker_service
from api.services.vision_service import vision_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
async def register_user(
    name: str = Form(...), 
    audio_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None)
):
    """
    Receives audio recording and/or facial image from the frontend.
    Saves them to the database using SpeakerService and VisionService.
    """
    logger.info(f"Register Request Received: {name}")
    
    if not audio_file and not image_file:
        raise HTTPException(status_code=400, detail="Must provide at least an audio or image file.")

    results = []

    if audio_file:
        try:
            audio_bytes = await audio_file.read()
            if audio_bytes:
                speaker_service.register_user(name, audio_bytes)
                results.append("voice")
        except Exception as e:
            logger.error(f"Voice Registration Error: {e}")
            raise HTTPException(status_code=500, detail=f"Voice Error: {str(e)}")

    if image_file:
        try:
            image_bytes = await image_file.read()
            if image_bytes:
                vision_service.register_face(name, image_bytes)
                results.append("face")
        except Exception as e:
            logger.error(f"Face Registration Error: {e}")
            raise HTTPException(status_code=400, detail=f"Face Error: {str(e)}")

    return {"status": "success", "message": f"User '{name}' registered successfully with: {', '.join(results)}"}


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