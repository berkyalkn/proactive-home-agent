from fastapi import APIRouter, UploadFile, File, HTTPException
from api.services.vision_service import vision_service
import logging
import cv2
import numpy as np

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vision", tags=["Vision Analysis"])

@router.post("/analyze")
async def analyze_frame(image_file: UploadFile = File(...)):
    """
    It captures snapshots from the MacBook camera.
    Using VisionService, it detects and verifies the faces in these frames.
    """
    logger.info("Motion frame received! Analyzing for faces...")
    
    try:
        image_bytes = await image_file.read()
        if not image_bytes:
             raise HTTPException(status_code=400, detail="Empty image file received.")
             
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode image.")

        result = vision_service.recognize(frame)

        if not result["face_found"]:
            logger.info("Motion detected, but no faces found in the frame. (Ghost/Pet/Shadow?)")
            return {"status": "no_face_detected", "message": "Motion triggered, but no face visible."}

        person_name = result["name"]
        confidence = result["confidence"]

        if person_name == "Unknown" or person_name is None:
            logger.warning("INTRUDER ALERT: Unknown person detected!")
            return {"status": "unknown_person", "message": "Face detected, but not in the database."}
        
        else:
            logger.info(f"AUTHORIZED ENTRY: {person_name} recognized (Confidence: {confidence:.2f})")
            return {"status": "authorized", "user": person_name, "confidence": confidence}

    except Exception as e:
        logger.error(f"Vision Analysis Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during image analysis.")