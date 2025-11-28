from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
import uuid

# --- ODALAR ---
class Room(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    devices: List["Device"] = Relationship(back_populates="room")

# --- CİHAZLAR ---
class Device(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    device_type: str
    ip_address: Optional[str] = None
    is_active: bool = True
    room_id: Optional[int] = Field(default=None, foreign_key="room.id")
    room: Optional[Room] = Relationship(back_populates="devices")
    readings: List["SensorReading"] = Relationship(back_populates="device")
    decisions: List["AgentDecision"] = Relationship(back_populates="target_device")

# --- SENSÖR VERİLERİ ---
class SensorReading(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    device_id: uuid.UUID = Field(foreign_key="device.id")
    device: Device = Relationship(back_populates="readings")
    reading_type: str
    value: float
    unit: str

# --- AJAN KARARLARI ---
class AgentDecision(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    target_device_id: uuid.UUID = Field(foreign_key="device.id")
    target_device: Device = Relationship(back_populates="decisions")
    action: str
    parameters: Optional[str] = None
    reasoning: str
    confidence: float
    feedback: Optional["UserFeedback"] = Relationship(back_populates="decision")

# --- KULLANICI GERİ BİLDİRİMİ ---
class UserFeedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    decision_id: int = Field(foreign_key="agentdecision.id")
    decision: AgentDecision = Relationship(back_populates="feedback")
    is_positive: bool
    correction: Optional[str] = None

# --- SİSTEM LOGLARI ---
class SystemLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    level: str
    source: str
    message: str