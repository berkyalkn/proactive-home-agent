from typing import Any, List

import numpy as np

from ..config.settings import Config
from .yolo_base import BaseDetector


class FaceDetector(BaseDetector):
    """
    Face detection using YOLOv8-face.

    Detects faces in frames with bounding boxes and confidence scores.
    Optimized for face recognition pipeline.
    """

    def __init__(self, config: Config, model_name: str = "yolov8n-face.pt"):
        """
        Initialize face detector.

        Args:
            config: Configuration object
            model_name: Name of the YOLO-face model file
        """
        super().__init__(config, model_name)
        self.confidence_threshold = config.detection.confidence

    def detect(self, frame: np.ndarray) -> dict:
        """
        Detect faces in a frame.

        Args:
            frame: Input frame as numpy array (BGR)

        Returns:
            Dictionary with:
            - faces_found: bool
            - count: int
            - boxes: list of [x1, y1, x2, y2] bounding boxes
            - confidences: list of confidence scores
            - keypoints: list of facial landmarks (if available)
        """
        if frame is None or frame.size == 0:
            return self._empty_result()

        try:
            # Run inference
            results = self.model(frame, **self.get_inference_kwargs())

            # Extract face detections
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

                            # Extract keypoints if available (YOLO-face landmarks)
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
            print(f"Error in face detection: {e}")
            return self._empty_result()

    def _empty_result(self) -> dict:
        """Return empty result structure."""
        return {
            "faces_found": False,
            "count": 0,
            "boxes": [],
            "confidences": [],
            "faces": [],
            "keypoints": [],
        }

    def extract_face_roi(self, frame: np.ndarray, padding: int = 20) -> List[np.ndarray]:
        """
        Extract face regions of interest from frame.

        Args:
            frame: Input frame
            padding: Padding around face bounding box

        Returns:
            List of face ROIs as numpy arrays
        """
        result = self.detect(frame)
        rois = []

        h, w = frame.shape[:2]

        for face in result["faces"]:
            x1, y1, x2, y2 = face["box"]

            # Add padding with bounds checking
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(w, x2 + padding)
            y2 = min(h, y2 + padding)

            roi = frame[y1:y2, x1:x2]
            if roi.size > 0:
                rois.append(roi)

        return rois

    def get_largest_face(self, frame: np.ndarray) -> dict:
        """
        Get the largest (closest/primary) face in the frame.

        Args:
            frame: Input frame

        Returns:
            Dictionary with bounding box and confidence, or empty if no face found
        """
        result = self.detect(frame)

        if not result["faces_found"]:
            return {}

        # Find largest by area
        largest = max(result["faces"], key=lambda f: (f["box"][2] - f["box"][0]) * (f["box"][3] - f["box"][1]))
        return largest