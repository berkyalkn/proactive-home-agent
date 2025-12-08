from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
import uuid

class Device(SQLModel, table=True):
    __tablename__ = "devices"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    device_type: str      
    protocol: str          
    location: str          
    ip_address: Optional[str] = None
    is_active: bool = True
    
    readings: List["SensorReading"] = Relationship(back_populates="device")
    decisions: List["AgentDecision"] = Relationship(back_populates="target_device")


class SensorReading(SQLModel, table=True):
    __tablename__ = "sensor_readings"
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    
    device_id: uuid.UUID = Field(foreign_key="devices.id")
    device: Device = Relationship(back_populates="readings")
    
    reading_type: str      
    value: float
    unit: str
    source: str = "sensor" 


class AgentDecision(SQLModel, table=True):
    __tablename__ = "agent_decisions"
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    target_device_id: uuid.UUID = Field(foreign_key="devices.id")
    target_device: Device = Relationship(back_populates="decisions")
    
    action: str
    reasoning: str
    confidence: float
    
    feedback: Optional["UserFeedback"] = Relationship(back_populates="decision")


class UserFeedback(SQLModel, table=True):
    __tablename__ = "user_feedback"
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    decision_id: int = Field(foreign_key="agent_decisions.id")
    decision: AgentDecision = Relationship(back_populates="feedback")
    
    is_positive: bool
    correction: Optional[str] = None


class SystemLog(SQLModel, table=True):
    __tablename__ = "system_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    level: str
    source: str
    message: str