from typing import Any
import logging

import numpy as np

from ..config.settings import Config
from .yolo_base import BaseDetector

logger = logging.getLogger(__name__)

class PersonDetector(BaseDetector):
    """
    Person detection using YOLOv10n.
    
    Optimized for Edge AI. Detects human presence (COCO Class 0) 
    even when faces are not visible.
    """

    def __init__(self, config: Config, model_name: str = "yolov10n.pt"):
        super().__init__(config, model_name)
        self.min_confidence = config.person_detection.min_confidence

    def detect(self, frame: np.ndarray) -> dict:
        """Detect people in a frame."""
        if frame is None or frame.size == 0:
            return self._empty_result()

        try:
            results = self.model(frame, **self.get_inference_kwargs())

            persons = []
            confidences = []
            boxes = []

            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        cls_id = int(box.cls[0])
                        conf = float(box.conf[0])
                        
                        if cls_id == 0 and conf >= self.min_confidence:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            
                            box_coords = [int(x1), int(y1), int(x2), int(y2)]
                            boxes.append(box_coords)
                            confidences.append(conf)
                            persons.append({
                                "box": box_coords, 
                                "confidence": conf
                            })

            return {
                "persons_found": len(persons) > 0,
                "count": len(persons),
                "boxes": boxes,
                "confidences": confidences,
                "persons": persons,
            }

        except Exception as e:
            logger.error(f"Error in person detection inference: {e}")
            return self._empty_result()

    def _empty_result(self) -> dict:
        return {
            "persons_found": False,
            "count": 0,
            "boxes": [],
            "confidences": [],
            "persons": [],
        }

    def get_largest_person(self, frame: np.ndarray) -> dict:
        """Get the largest (closest) person in the frame based on bounding box area."""
        result = self.detect(frame)

        if not result["persons_found"]:
            return {}

        largest = max(
            result["persons"], 
            key=lambda p: (p["box"][2] - p["box"][0]) * (p["box"][3] - p["box"][1])
        )
        return largest

    def count_persons(self, frame: np.ndarray) -> int:
        """Count number of persons in frame."""
        result = self.detect(frame)
        return result["count"]