from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
import logging

from ultralytics import YOLO

from ..config.settings import Config

logger = logging.getLogger(__name__)

class BaseDetector(ABC):
    """
    Abstract base class for YOLO-based detectors.

    Optimized for Raspberry Pi (Edge Computing) using CPU.
    Strips out unnecessary CUDA/MPS checks for faster initialization.
    """

    def __init__(self, config: Config, model_name: str):
        self.config = config
        self.model_name = model_name
        self.model_path = Path(config.models_dir) / model_name
        self.device = "cpu" 
        self._model: YOLO | None = None

        self.model_path.parent.mkdir(parents=True, exist_ok=True)

    @property
    def model(self) -> YOLO:
        """Lazy load the YOLO model."""
        if self._model is None:
            self._model = self._load_model()
        return self._model

    def _load_model(self) -> YOLO:
        """
        Load the YOLO model specifically for ARM CPU.
        """
        if not self.model_path.exists():
            logger.warning(f"Model {self.model_name} not found locally. Ultralytics will try to download it...")

        try:
            model = YOLO(str(self.model_path) if self.model_path.exists() else self.model_name)
            model.to(self.device)
            logger.info(f"Successfully loaded YOLO model: {self.model_name} on {self.device}")
            return model

        except Exception as e:
            logger.error(f"Error loading model {self.model_name}: {e}")
            raise RuntimeError(f"Could not initialize Vision model on Raspberry Pi: {e}")

    @abstractmethod
    def detect(self, frame: Any) -> dict:
        """Run detection on a frame."""
        pass

    def get_inference_kwargs(self) -> dict:
        """
        Get keyword arguments for model inference.
        """
        return {
            "conf": self.config.detection.confidence,
            "iou": self.config.detection.iou,
            "verbose": False,
            "device": self.device,
        }

    def preprocess(self, frame: Any) -> Any:
        return frame

    def postprocess(self, results: Any) -> dict:
        return {"results": results}

    def warmup(self) -> None:
        """Run a warmup inference to initialize model and allocate RAM."""
        import numpy as np
        logger.info(f"Warming up model {self.model_name}...")
        dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)
        self.detect(dummy_frame)