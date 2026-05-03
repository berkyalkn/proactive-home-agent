from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
import uuid
from sqlalchemy import Column, JSON

class Room(SQLModel, table=True):
    __tablename__ = "rooms"
    id: Optional[int] = Field(default=None, primary_key=True)
    room_key: str = Field(index=True) 
    display_name: str 
    icon_name: str = Field(default="MapPin") 
    owner_id: int = Field(foreign_key="users.id", index=True)
    devices: List["Device"] = Relationship(
        back_populates="room",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class Device(SQLModel, table=True):
    __tablename__ = "devices"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str 
    display_name: Optional[str] = None 
    device_type: str      
    protocol: str          
    room_id: int = Field(foreign_key="rooms.id")
    room: "Room" = Relationship(back_populates="devices")
    ip_address: Optional[str] = None
    is_active: bool = True
    
    readings: List["SensorReading"] = Relationship(
        back_populates="device",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    decisions: List["AgentDecision"] = Relationship(
        back_populates="target_device",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

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
    
    feedback: Optional["UserFeedback"] = Relationship(
        back_populates="decision",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


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


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    role: str = Field(default="guest") 
    owner_id: Optional[int] = Field(default=None, foreign_key="users.id") 
    voice_embedding: Optional[List[float]] = Field(default=None, sa_column=Column(JSON))
    face_embedding: Optional[List[float]] = Field(default=None, sa_column=Column(JSON)) 
    hashed_password: str = Field(nullable=False)   
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_seen: Optional[datetime] = Field(default=None)
    is_onboarding_complete: bool = Field(default=False)


class GestureMapping(SQLModel, table=True):
    __tablename__ = "gesture_mappings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id", index=True)
    gesture_name: str 
    target_device_id: uuid.UUID = Field(foreign_key="devices.id")
    action: str 
    owner: User = Relationship()
    target_device: Device = Relationship()


class SecuritySettings(SQLModel, table=True):
    __tablename__ = "security_settings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id")
    emergency_gesture: str = Field(default="")
    emergency_action_text: str = Field(default="Flash all lights red for 10 seconds and sound the alarm.")
    emergency_contact_name: str = Field(default="")
    emergency_phone: str = Field(default="")
    use_sms: bool = Field(default=True)
    use_voice_call: bool = Field(default=True)
    use_telegram: bool = Field(default=True)
    is_active: bool = Field(default=True)