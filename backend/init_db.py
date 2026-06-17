from sqlmodel import SQLModel
from database.settings import engine
from database.models import Device, Room, User, SystemLog, SensorReading, AgentDecision, UserFeedback, SecuritySettings, GestureMapping, BehavioralTelemetry

def init_db():
    print("Dropping old tables and creating new ones...")
    SQLModel.metadata.drop_all(engine) 

    print("Creating empty database tables...")
    SQLModel.metadata.create_all(engine)
    
    print("Database is clean and ready for a fresh Onboarding! ")

if __name__ == "__main__":
    init_db()