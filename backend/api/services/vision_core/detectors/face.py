from typing import List
import logging

import numpy as np

from ..config.settings import Config
from .yolo_base import BaseDetector

logger = logging.getLogger(__name__)

class FaceDetector(BaseDetector):
    """
    Face detection using YOLOv8-face.
    
    Optimized for Edge AI. Extracts bounding boxes and basic landmarks.
    """

    def __init__(self, config: Config, model_name: str = "yolov8n-face.pt"):
        super().__init__(config, model_name)
        self.confidence_threshold = config.detection.confidence

    def detect(self, frame: np.ndarray) -> dict:
        """
        Detect faces in a frame.
        """
        if frame is None or frame.size == 0:
            return self._empty_result()

        try:
            results = self.model(frame, **self.get_inference_kwargs())

            faces = []
            confidences = []
            boxes = []
            keypoints = []

            for result in results:
                if result.boxes is not None:
                    for i, box in enumerate(result.boxes):
                        conf = float(box.conf[0])
                        
                        if conf >= self.confidence_threshold:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            face_data = {
                                "box": [int(x1), int(y1), int(x2), int(y2)],
                                "confidence": conf,
                            }

                            if result.keypoints is not None and i < len(result.keypoints):
                                kpts = result.keypoints[i].data.cpu().numpy()
                                face_data["keypoints"] = kpts
                                keypoints.append(kpts)

                            faces.append(face_data)
                            boxes.append([int(x1), int(y1), int(x2), int(y2)])
                            confidences.append(conf)

            return {
                "faces_found": len(faces) > 0,
                "count": len(faces),
                "boxes": boxes,
                "confidences": confidences,
                "faces": faces,
                "keypoints": keypoints,
            }

        except Exception as e:
            logger.error(f"Error in face detection inference: {e}")
            return self._empty_result()

    def _empty_result(self) -> dict:
        return {
            "faces_found": False,
            "count": 0,
            "boxes": [],
            "confidences": [],
            "faces": [],
            "keypoints": [],
        }

    def extract_face_roi(self, frame: np.ndarray, padding: int = 20) -> List[np.ndarray]:
        """Extract padded face regions safely."""
        result = self.detect(frame)
        rois = []

        h, w = frame.shape[:2]

        for face in result["faces"]:
            x1, y1, x2, y2 = face["box"]

            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(w, x2 + padding)
            y2 = min(h, y2 + padding)

            roi = frame[y1:y2, x1:x2]
            if roi.size > 0:
                rois.append(roi)

        return rois

    def get_largest_face(self, frame: np.ndarray) -> dict:
        """Get the primary face based on bounding box area."""
        result = self.detect(frame)

        if not result["faces_found"]:
            return {}

        largest = max(result["faces"], key=lambda f: (f["box"][2] - f["box"][0]) * (f["box"][3] - f["box"][1]))
        return largest