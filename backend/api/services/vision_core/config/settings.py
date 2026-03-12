import os
from pathlib import Path
from typing import Literal, Optional, Tuple, Union

import yaml
from pydantic import BaseModel, Field, field_validator


class VideoConfig(BaseModel):
    """Video input configuration."""

    source: Literal["camera", "rtsp", "file"] = "camera"
    path: str = "0"
    fps: int = 30
    resolution: Tuple[int, int] = (1280, 720)
    queue_size: int = 10

    @field_validator("resolution", mode="before")
    @classmethod
    def parse_resolution(cls, v):
        """Parse resolution from list or tuple."""
        if isinstance(v, list):
            return tuple(v)
        return v


class DetectionConfig(BaseModel):
    """Detection configuration."""

    device: str = "auto"
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    iou: float = Field(default=0.45, ge=0.0, le=1.0)
    max_detections: int = Field(default=10, ge=1)


class QualityGateConfig(BaseModel):
    """Quality gate configuration for incremental learning."""

    enabled: bool = True
    min_face_size: int = Field(default=80, ge=1)
    min_laplacian_var: int = Field(default=80, ge=0)
    max_pose_angle: float = Field(default=15.0, ge=0.0, le=90.0)
    min_track_frames: int = Field(default=3, ge=1)
    learn_interval_frames: int = Field(default=30, ge=1)


class FaceRecognitionConfig(BaseModel):
    """Face recognition configuration."""

    enabled: bool = True
    model: str = "GhostFaceNet" 
    threshold: float = Field(default=0.45, ge=0.0, le=1.0)
    database_path: str = "data/embeddings/faces.pkl"
    detector_model: str = "yolov8n-face.pt"
    alignment_backend: Literal["fan", "deepface", "none"] = "fan"
    quality_gate: QualityGateConfig = Field(default_factory=QualityGateConfig)


class FallDetectionConfig(BaseModel):
    """Fall detection configuration."""

    enabled: bool = True
    aspect_ratio_threshold: float = Field(default=2.5, ge=1.0)
    min_frames_for_fall: int = Field(default=5, ge=1)
    alert_cooldown: int = Field(default=30, ge=0) 
    pose_model: str = "yolov8n-pose.pt"


class GestureDetectionConfig(BaseModel):
    """Gesture detection configuration."""

    enabled: bool = True
    smoothing_window: int = Field(default=5, ge=1)
    min_confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    pose_model: str = "yolov8n-pose.pt"


class AlertsConfig(BaseModel):
    """Alert configuration."""

    console: bool = True
    log_file: str = "data/logs/events.jsonl"
    screenshot_on_event: bool = True
    screenshot_path: str = "data/logs/screenshots"


class PersonDetectionConfig(BaseModel):
    """Person detection configuration."""

    enabled: bool = True
    model: str = "yolov10n.pt"
    min_confidence: float = Field(default=0.5, ge=0.0, le=1.0)


class LoggingConfig(BaseModel):
    """Logging configuration."""

    level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    format: str = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
    rotation: str = "10 MB"
    retention: str = "7 days"


class Config(BaseModel):
    """Main configuration model."""

    video: VideoConfig = Field(default_factory=VideoConfig)
    detection: DetectionConfig = Field(default_factory=DetectionConfig)
    face_recognition: FaceRecognitionConfig = Field(default_factory=FaceRecognitionConfig)
    fall_detection: FallDetectionConfig = Field(default_factory=FallDetectionConfig)
    gesture_detection: GestureDetectionConfig = Field(default_factory=GestureDetectionConfig)
    person_detection: PersonDetectionConfig = Field(default_factory=PersonDetectionConfig)
    alerts: AlertsConfig = Field(default_factory=AlertsConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)

    models_dir: str = "data/models"

    class Config:
        """Pydantic config."""

        validate_assignment = True


def load_config(config_path: Optional[Union[str, Path]] = None) -> Config:
    """
    Load configuration from YAML file with environment variable overrides.

    Args:
        config_path: Path to config file. Defaults to config/default_config.yaml

    Returns:
        Config object
    """
    if config_path is None:
        possible_paths = [
            Path("config/default_config.yaml"),
            Path("default_config.yaml"),
            Path(__file__).parent.parent.parent / "config" / "default_config.yaml",
        ]
        config_path = next((p for p in possible_paths if p.exists()), possible_paths[0])
    else:
        config_path = Path(config_path)

    config_data = {}
    if config_path.exists():
        with open(config_path) as f:
            config_data = yaml.safe_load(f) or {}

    for key, value in os.environ.items():
        if key.startswith("VIDEO_"):
            parts = key[6:].lower().split("_", 1)
            if len(parts) == 2:
                section, setting = parts
                if value.lower() in ("true", "false"):
                    value = value.lower() == "true"
                elif value.isdigit():
                    value = int(value)
                elif value.replace(".", "").isdigit():
                    value = float(value)

                if section not in config_data:
                    config_data[section] = {}
                config_data[section][setting] = value

    return Config(**config_data)


def get_device(config: Config) -> str:
    """
    Get the appropriate device for model inference.

    Args:
        config: Configuration object

    Returns:
        Device string (mps, cpu, cuda)
    """
    device_setting = config.detection.device.lower()

    if device_setting == "auto":
        import torch

        if torch.backends.mps.is_available():
            return "mps"
        elif torch.cuda.is_available():
            return "cuda"
        else:
            return "cpu"

    return device_setting