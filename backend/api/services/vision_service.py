import io
import logging
import numpy as np
import cv2
from deepface import DeepFace
from sqlmodel import Session, select

from database.settings import engine
from database.models import User

from api.services.vision_core.config.settings import Config 
from api.services.vision_core.detectors.face import FaceDetector
from api.services.vision_core.recognizers.face_aligner import FaceAligner

logger = logging.getLogger(__name__)

class VisionService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            logger.info("Initializing Edge-Optimized Vision Service...")
            cls._instance = super(VisionService, cls).__new__(cls)
            cls._instance.known_faces = {}
            cls._instance.model_name = "GhostFaceNet"
            
            config = Config()
            config.detection.confidence = 0.6 
            config.detection.device = "cpu"
            
            config.face_recognition.alignment_backend = "none" 
            
            cls._instance.aligner = FaceAligner(device="cpu") if config.face_recognition.alignment_backend == "fan" else None
            
            cls._instance.detector = FaceDetector(
                config=config, 
                model_name="yolov8n-face.pt"
            )
            
            cls._instance.load_faces_from_db()
        return cls._instance

    def load_faces_from_db(self):
        """Vectors are loaded into RAM from PostgreSQL."""
        self.known_faces = {}
        try:
            with Session(engine) as session:
                statement = select(User).where(User.face_embedding.is_not(None))
                users = session.exec(statement).all()
                
                for user in users:
                    if user.face_embedding:
                        self.known_faces[user.username] = np.array(user.face_embedding)
            
            logger.info(f"Loaded {len(self.known_faces)} face embeddings from DB.")
        except Exception as e:
            logger.error(f"Error loading faces from DB: {e}")

    def register_face(self, username: str, image_bytes: bytes) -> bool:
        """It processes the incoming photo, extracts the vector, and saves it to PostgreSQL."""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                raise ValueError("Could not decode image.")

            max_width = 640
            h, w = frame.shape[:2]
            if w > max_width:
                ratio = max_width / float(w)
                new_h = int(h * ratio)
                frame = cv2.resize(frame, (max_width, new_h), interpolation=cv2.INTER_AREA)

            detection = self.detector.detect(frame)
            if not detection["faces_found"]:
                raise ValueError("No face detected in the image.")
            
            face_data = max(
                detection["faces"],
                key=lambda f: (f["box"][2] - f["box"][0]) * (f["box"][3] - f["box"][1]),
            )
            x1, y1, x2, y2 = face_data["box"]
            
            face_roi = self._extract_padded_roi(frame, x1, y1, x2, y2)

            embedding = self._extract_embedding(face_roi)
            
            if embedding is None:
                raise ValueError("Could not extract facial features. Try looking straight at the camera.")

            embedding_list = embedding.tolist()

            with Session(engine) as session:
                statement = select(User).where(User.username == username)
                existing_user = session.exec(statement).first()
                
                if existing_user:
                    existing_user.face_embedding = embedding_list
                    session.add(existing_user)
                    logger.info(f"Updated face for existing user: {username}")
                else:
                    new_user = User(username=username, role="admin", face_embedding=embedding_list)
                    session.add(new_user)
                    logger.info(f"Created new user with face: {username}")
                
                session.commit()

            self.known_faces[username] = embedding
            return True

        except Exception as e:
            logger.error(f"Face registration failed for {username}: {e}")
            raise e

    def _extract_padded_roi(self, frame: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> np.ndarray:
        h, w = frame.shape[:2]
        face_w, face_h = x2 - x1, y2 - y1
        pad_x = int(face_w * 0.3)
        pad_y = int(face_h * 0.3)
        px1 = max(0, x1 - pad_x)
        py1 = max(0, y1 - pad_y)
        px2 = min(w, x2 + pad_x)
        py2 = min(h, y2 + pad_y)
        return frame[py1:py2, px1:px2]

    def _extract_embedding(self, face_image: np.ndarray) -> np.ndarray | None:
        try:
            input_image = face_image
            
            if self.aligner is not None:
                aligned = self.aligner.align(face_image)
                input_image = aligned if aligned is not None else face_image

            result = DeepFace.represent(
                img_path=input_image,
                model_name=self.model_name,
                enforce_detection=False,
                align=False, 
            )
            if result and len(result) > 0:
                return np.array(result[0]["embedding"])
        except Exception as e:
            logger.error(f"Extraction error: {e}")
        return None

vision_service = VisionService()