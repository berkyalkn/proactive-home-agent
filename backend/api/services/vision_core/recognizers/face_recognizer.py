import time
import logging
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
from deepface import DeepFace
import cv2

from ..config.settings import Config
from ..detectors.face import FaceDetector
from .face_aligner import FaceAligner

logger = logging.getLogger(__name__)

MIN_FACE_SIZE = 40
FACE_PADDING_RATIO = 0.3
MAX_EMBEDDINGS_PER_PERSON = 20
INCREMENTAL_LEARN_THRESHOLD = 0.65
TRACKING_IOU_THRESHOLD = 0.4
TRACKING_TIMEOUT = 2.0

MIN_LEARN_FACE_SIZE = 80
MIN_LAPLACIAN_VAR = 80
MAX_POSE_ANGLE = 15.0
MIN_TRACK_FRAMES = 3
LEARN_INTERVAL_FRAMES = 30

class TrackedFace:
    """A face being tracked across frames to save CPU."""
    __slots__ = ("box", "name", "confidence", "last_seen", "frame_count")

    def __init__(self, box: list, name: Optional[str], confidence: float):
        self.box = box
        self.name = name
        self.confidence = confidence
        self.last_seen = time.monotonic()
        self.frame_count = 1

    def update(self, box: list, name: Optional[str] = None, confidence: float = 0.0):
        self.box = box
        self.last_seen = time.monotonic()
        self.frame_count += 1
        if name is not None:
            self.name = name
            self.confidence = confidence

    @property
    def is_expired(self) -> bool:
        return (time.monotonic() - self.last_seen) > TRACKING_TIMEOUT

class FaceRecognizer:
    """
    Main Recognition Engine optimized for Raspberry Pi 5.
    
    Handles: Tracking, Identification, and Quality-Gated Learning.
    """

    def __init__(self, config: Config):
        self.config = config
        self.face_config = config.face_recognition
        self.threshold = self.face_config.threshold
        self.model_name = self.face_config.model
        self.detector = FaceDetector(config, model_name=self.face_config.detector_model)
        self.aligner: FaceAligner | None = None
        
        if self.face_config.alignment_backend == "fan":
            self.aligner = FaceAligner(device="cpu")
            logger.info("Face alignment backend: FAN (Active)")

        self.known_faces: Dict[str, List[np.ndarray]] = {}
        self._tracked_faces: List[TrackedFace] = []


    def _find_tracked_face(self, box: list) -> Optional[TrackedFace]:
        """Find an existing tracked face matching this box by IoU."""
        self._tracked_faces = [t for t in self._tracked_faces if not t.is_expired]

        best_track = None
        best_iou = TRACKING_IOU_THRESHOLD

        for track in self._tracked_faces:
            iou = self._compute_iou(box, track.box)
            if iou > best_iou:
                best_iou = iou
                best_track = track
        return best_track

    @staticmethod
    def _compute_iou(box_a: list, box_b: list) -> float:
        """Intersection over Union calculation."""
        xa, ya, xb, yb = max(box_a[0], box_b[0]), max(box_a[1], box_b[1]), min(box_a[2], box_b[2]), min(box_a[3], box_b[3])
        inter = max(0, xb - xa) * max(0, yb - ya)
        if inter == 0: return 0.0
        area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
        area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
        return inter / (area_a + area_b - inter)


    def recognize(self, frame: np.ndarray) -> dict:
        """
        Recognize faces with Smart Tracking to save Raspberry Pi CPU.
        """
        if not self.face_config.enabled:
            return self._empty_result()

        detection = self.detector.detect(frame)
        if not detection["faces_found"]:
            return self._empty_result()

        face_data = max(detection["faces"], key=lambda f: (f["box"][2] - f["box"][0]) * (f["box"][3] - f["box"][1]))
        box = face_data["box"]

        tracked = self._find_tracked_face(box)
        if tracked and tracked.name is not None:
            tracked.update(box)
            return {
                "face_found": True,
                "name": tracked.name,
                "confidence": tracked.confidence,
                "location": box
            }

        face_roi = self._extract_padded_roi(frame, box[0], box[1], box[2], box[3])
        embedding = self._extract_embedding(face_roi)
        
        if embedding is None:
            return self._empty_result()

        best_match = self._find_best_match(embedding)

        if best_match and best_match[1] >= self.threshold:
            name, similarity = best_match
            if tracked:
                tracked.update(box, name, similarity)
            else:
                self._tracked_faces.append(TrackedFace(box, name, similarity))
            
            return {
                "face_found": True,
                "name": name,
                "confidence": similarity,
                "location": box
            }

        return {
            "face_found": True,
            "name": "Unknown",
            "confidence": 0.0,
            "location": box
        }

    def _extract_embedding(self, face_image: np.ndarray) -> Optional[np.ndarray]:
        """Extract face signature using DeepFace."""
        try:
            input_image = face_image
            if self.aligner:
                aligned = self.aligner.align(face_image)
                if aligned is not None: input_image = aligned

            result = DeepFace.represent(
                img_path=input_image,
                model_name=self.model_name,
                enforce_detection=False,
                align=False, 
            )
            return np.array(result[0]["embedding"]) if result else None
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return None

    def _find_best_match(self, embedding: np.ndarray) -> Optional[tuple[str, float]]:
        """Compare current signature with database."""
        if not self.known_faces: return None
        best_name, best_sim = None, -1.0

        for name, embeds in self.known_faces.items():
            for known_emb in embeds:
                sim = np.dot(embedding, known_emb) / (np.linalg.norm(embedding) * np.linalg.norm(known_emb))
                if sim > best_sim:
                    best_sim = sim
                    best_name = name
        return (best_name, best_sim) if best_name else None

    @staticmethod
    def _extract_padded_roi(frame: np.ndarray, x1, y1, x2, y2) -> np.ndarray:
        h, w = frame.shape[:2]
        pw, ph = int((x2-x1)*0.3), int((y2-y1)*0.3)
        return frame[max(0, y1-ph):min(h, y2+ph), max(0, x1-pw):min(w, x2+pw)]

    def _empty_result(self) -> dict:
        return {"face_found": False, "name": None, "confidence": 0.0, "location": None}