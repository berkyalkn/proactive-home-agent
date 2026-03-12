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
        if isinstance(v, list):
            return tuple(v)
        return v


class DetectionConfig(BaseModel):
    """Detection configuration."""
    device: str = "cpu"
    confidence: float = Field(default=0.6, ge=0.0, le=1.0)
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
    alignment_backend: Literal["fan", "deepface", "none"] = "none"
    quality_gate: QualityGateConfig = Field(default_factory=QualityGateConfig)


class FallDetectionConfig(BaseModel):
    enabled: bool = True
    aspect_ratio_threshold: float = Field(default=2.5, ge=1.0)
    min_frames_for_fall: int = Field(default=5, ge=1)
    alert_cooldown: int = Field(default=30, ge=0) 
    pose_model: str = "yolov8n-pose.pt"


class GestureDetectionConfig(BaseModel):
    enabled: bool = True
    smoothing_window: int = Field(default=5, ge=1)
    min_confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    pose_model: str = "yolov8n-pose.pt"


class AlertsConfig(BaseModel):
    console: bool = True
    log_file: str = "data/logs/events.jsonl"
    screenshot_on_event: bool = True
    screenshot_path: str= "data/logs/screenshots"


class PersonDetectionConfig(BaseModel):
    enabled: bool = True
    model: str = "yolov10n.pt"
    min_confidence: float = Field(default=0.5, ge=0.0, le=1.0)


class LoggingConfig(BaseModel):
    level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    format: str = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
    rotation: str = "10 MB"
    retention: str = "7 days"


class Config(BaseModel):
    """Main configuration model."""
    video: VideoConfig = Field(default_factory=VideoConfig)
    detection: DetectionConfig = Field(default_factory=DetectionConfig)
    face_recognition: FaceRecognitionConfig = Field(default_factory=FaceRecognitionConfig)