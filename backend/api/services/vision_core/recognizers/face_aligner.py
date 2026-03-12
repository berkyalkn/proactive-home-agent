import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

ARCFACE_REFERENCE_POINTS = np.array(
    [
        [38.2946, 51.6963],
        [73.5318, 51.5014],
        [56.0252, 71.7366],
        [41.5493, 92.3655],
        [70.7299, 92.2041],
    ],
    dtype=np.float32,
)

LANDMARK_68_TO_5 = {
    "left_eye": list(range(36, 42)),   
    "right_eye": list(range(42, 48)),  
    "nose_tip": [30],                  
    "left_mouth": [48],                
    "right_mouth": [54],               
}

ALIGNED_FACE_SIZE = (112, 112)

class FaceAligner:
    """
    Edge-Optimized face alignment using FAN (Face Alignment Network).
    Warp faces to a canonical 112x112 template.
    """

    def __init__(self, device: str = "cpu"):
        """
        Initialize FAN model for Edge CPU.
        """
        self._fa = None
        self._device = "cpu"

    def _ensure_model(self):
        """Lazy-load the FAN model on first use."""
        if self._fa is not None:
            return

        try:
            import face_alignment
            self._fa = face_alignment.FaceAlignment(
                face_alignment.LandmarksType.TWO_D,
                device=self._device,
                flip_input=False,
            )
            logger.info(f"FAN face alignment model loaded on {self._device}")
        except ImportError:
            logger.error("face_alignment library not found. Run: pip install face-alignment")
            raise


    def align(self, face_roi: np.ndarray) -> np.ndarray | None:
        """Align a face ROI to canonical 112x112 template."""
        self._ensure_model()

        try:
            rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
            landmarks = self._fa.get_landmarks(rgb)

            if landmarks is None or len(landmarks) == 0:
                logger.debug("FAN: no landmarks detected in ROI")
                return None

            lm68 = landmarks[0] 
            src_points = self._extract_5_from_68(lm68)
            aligned = self._warp_to_canonical(face_roi, src_points)
            return aligned

        except Exception as e:
            logger.error(f"FAN alignment error: {e}")
            return None

    def get_landmarks(self, face_roi: np.ndarray) -> np.ndarray | None:
        """Get 68 facial landmarks for a face ROI."""
        self._ensure_model()

        try:
            rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
            landmarks = self._fa.get_landmarks(rgb)
            if landmarks and len(landmarks) > 0:
                return landmarks[0]
        except Exception as e:
            logger.error(f"FAN landmark error: {e}")

        return None

    @staticmethod
    def _extract_5_from_68(lm68: np.ndarray) -> np.ndarray:
        """Extract 5 canonical reference points from 68 landmarks."""
        left_eye = lm68[LANDMARK_68_TO_5["left_eye"]].mean(axis=0)
        right_eye = lm68[LANDMARK_68_TO_5["right_eye"]].mean(axis=0)
        nose_tip = lm68[LANDMARK_68_TO_5["nose_tip"]].mean(axis=0)
        left_mouth = lm68[LANDMARK_68_TO_5["left_mouth"]].mean(axis=0)
        right_mouth = lm68[LANDMARK_68_TO_5["right_mouth"]].mean(axis=0)

        return np.array(
            [left_eye, right_eye, nose_tip, left_mouth, right_mouth],
            dtype=np.float32,
        )

    @staticmethod
    def _warp_to_canonical(image: np.ndarray, src_points: np.ndarray) -> np.ndarray:
        """Warp face to canonical 112x112 using SimilarityTransform."""
        from skimage.transform import SimilarityTransform

        tform = SimilarityTransform()
        tform.estimate(src_points, ARCFACE_REFERENCE_POINTS)

        M = tform.params[:2]  
        aligned = cv2.warpAffine(
            image,
            M,
            ALIGNED_FACE_SIZE,
            borderMode=cv2.BORDER_REPLICATE,
        )
        return aligned

    @staticmethod
    def estimate_pose(landmarks_68: np.ndarray) -> tuple[float, float, float]:
        """Estimate head pose (yaw, pitch, roll) from 68 facial landmarks."""
        
        model_points = np.array([
            (0.0, 0.0, 0.0),             
            (0.0, -330.0, -65.0),         
            (-225.0, 170.0, -135.0),      
            (225.0, 170.0, -135.0),       
            (-150.0, -150.0, -125.0),     
            (150.0, -150.0, -125.0),      
        ])

        image_points = np.array([
            landmarks_68[30],  
            landmarks_68[8],   
            landmarks_68[36],  
            landmarks_68[45],  
            landmarks_68[48],  
            landmarks_68[54],  
        ], dtype=np.float32)

        focal_length = 450
        center = (112, 112)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1],
        ], dtype=np.float32)

        dist_coeffs = np.zeros((4, 1))

        success, rotation_vector, _ = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs,
        )
        if not success:
            return (0.0, 0.0, 0.0)

        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)

        sy = np.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)
        singular = sy < 1e-6

        if not singular:
            roll = np.arctan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
            pitch = np.arctan2(-rotation_matrix[2, 0], sy)
            yaw = np.arctan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
        else:
            roll = np.arctan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
            pitch = np.arctan2(-rotation_matrix[2, 0], sy)
            yaw = 0.0

        return (np.degrees(yaw), np.degrees(pitch), np.degrees(roll))