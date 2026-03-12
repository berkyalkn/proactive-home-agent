from typing import Any, Optional, List
import logging

import numpy as np

from ..config.settings import Config
from .yolo_base import BaseDetector

logger = logging.getLogger(__name__)

class PoseDetector(BaseDetector):
    """
    Pose estimation using YOLOv8-pose.

    Optimized for Edge AI. Detects 17 body keypoints following COCO format.
    Serves as the foundation for Fall Detection and Gesture Recognition.
    """

    KEYPOINT_NAMES = [
        "nose", "left_eye", "right_eye", "left_ear", "right_ear",
        "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
        "left_wrist", "right_wrist", "left_hip", "right_hip",
        "left_knee", "right_knee", "left_ankle", "right_ankle",
    ]

    SKELETON_PAIRS = [
        (0, 1), (0, 2), (1, 3), (2, 4), 
        (5, 6),  
        (5, 7), (7, 9),  
        (6, 8), (8, 10),  
        (5, 11), (6, 12),  
        (11, 12),  
        (11, 13), (13, 15),  
        (12, 14), (14, 16),  
    ]

    def __init__(self, config: Config, model_name: str = "yolov8n-pose.pt"):
        super().__init__(config, model_name)
        self.min_confidence = config.detection.confidence

    def detect(self, frame: np.ndarray) -> dict:
        """Detect poses and extract keypoints in a frame."""
        if frame is None or frame.size == 0:
            return self._empty_result()

        try:
            results = self.model(frame, **self.get_inference_kwargs())

            poses = []

            for result in results:
                if result.keypoints is not None:
                    keypoints_data = result.keypoints.xy.cpu().numpy()  
                    conf_data = result.keypoints.conf.cpu().numpy()  
                    boxes_data = result.boxes.xyxy.cpu().numpy() if result.boxes is not None else None

                    for i, (kpts, confs) in enumerate(zip(keypoints_data, conf_data)):
                        avg_conf = float(np.mean(confs))
                        if avg_conf < self.min_confidence:
                            continue

                        pose = {
                            "keypoints": kpts.tolist(),  
                            "confidence": confs.tolist(),
                            "avg_confidence": avg_conf,
                        }

                        if boxes_data is not None and i < len(boxes_data):
                            x1, y1, x2, y2 = boxes_data[i]
                            pose["bbox"] = [int(x1), int(y1), int(x2), int(y2)]

                        poses.append(pose)

            return {
                "persons_found": len(poses) > 0,
                "count": len(poses),
                "poses": poses,
            }

        except Exception as e:
            logger.error(f"Error in pose detection inference: {e}")
            return self._empty_result()

    def _empty_result(self) -> dict:
        return {
            "persons_found": False,
            "count": 0,
            "poses": [],
        }

    def get_keypoints(self, frame: np.ndarray, person_idx: int = 0) -> Optional[np.ndarray]:
        """Get keypoints for a specific person. Returns (17, 3) array."""
        result = self.detect(frame)

        if not result["persons_found"] or person_idx >= len(result["poses"]):
            return None

        pose = result["poses"][person_idx]
        kpts = np.array(pose["keypoints"])  
        conf = np.array(pose["confidence"])  

        return np.column_stack([kpts, conf])

    def get_visible_keypoints(self, frame: np.ndarray, min_confidence: float = 0.5) -> List[dict]:
        """Get list of keypoints that are clearly visible above threshold."""
        result = self.detect(frame)
        visible = []

        if result["persons_found"]:
            pose = result["poses"][0]  
            for i, (kpt, conf) in enumerate(zip(pose["keypoints"], pose["confidence"])):
                if conf >= min_confidence:
                    visible.append({
                        "name": self.KEYPOINT_NAMES[i],
                        "index": i,
                        "x": float(kpt[0]),
                        "y": float(kpt[1]),
                        "confidence": float(conf),
                    })

        return visible