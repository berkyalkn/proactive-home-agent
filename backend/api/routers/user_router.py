from fastapi import APIRouter, UploadFile, Form, File, HTTPException
from api.services.speaker_service import speaker_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
async def register_user(name: str = Form(...), file: UploadFile = File(...)):
    """
    It receives the audio recording (Blob) from the frontend.
    It saves it to the database using SpeakerService.
    """
    logger.info(f"Register Request Received: {name}")
    
    audio_bytes = await file.read()
    
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    try:
        speaker_service.register_user(name, audio_bytes)
        return {"status": "success", "message": f"User '{name}' registered successfully."}
    
    except Exception as e:
        logger.error(f"Registration Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{username}")
def delete_user(username: str):
    """Deletes the user"""
    try:
        speaker_service.delete_user(username)
        return {"status": "success", "message": f"User {username} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
def list_users():
    """Lists registered usernames."""
    return {"users": list(speaker_service.known_users.keys())}