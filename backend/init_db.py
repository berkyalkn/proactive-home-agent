from sqlmodel import SQLModel, Session, select
from database.settings import engine
from database.models import Device, SensorReading, AgentDecision, UserFeedback, SystemLog

INITIAL_DEVICES = [
    {
        "name": "Living Room Plug",
        "device_type": "outlet",
        "protocol": "tapo",
        "location": "living_room",
<<<<<<< HEAD
        "ip_address": "192.168.0.22", 
=======
        "ip_address": "192.168.1.177", 
>>>>>>> origin/main
        "is_active": True
    },
    {
        "name": "Bedroom Plug",
        "device_type": "outlet",
        "protocol": "tapo",
        "location": "bedroom",
<<<<<<< HEAD
        "ip_address": "192.168.0.21",
        "is_active": True
    },
    {
        "name": "Living Room Bulb",
        "device_type": "bulb",
        "protocol": "tapo_bulb",
        "location": "living_room",
        "ip_address": "192.168.0.29",
        "is_active": True
    },
    {
        "name": "Bedroom Bulb",
        "device_type": "bulb",
        "protocol": "tapo_bulb",
        "location": "bedroom",
        "ip_address": "192.168.0.30",
=======
        "ip_address": "192.168.1.198",
>>>>>>> origin/main
        "is_active": True
    },
    {
        "name": "esp32_guestroom",  
        "device_type": "sensor_node",
        "protocol": "mqtt",
        "location": "guestroom",
<<<<<<< HEAD
        "ip_address": "192.168.0.20", 
=======
        "ip_address": "192.168.0.19", 
>>>>>>> origin/main
        "is_active": True
    },
    {
        "name": "esp32_livingroom",
        "device_type": "sensor_node",
        "protocol": "mqtt",
        "location": "living_room",
<<<<<<< HEAD
        "ip_address": "192.168.0.17",
=======
        "ip_address": "192.168.0.18",
>>>>>>> origin/main
        "is_active": True
    },
    {
        "name": "esp32_bedroom",
        "device_type": "sensor_node",
        "protocol": "mqtt",
        "location": "bedroom",
        "ip_address": "192.168.0.18",
        "is_active": True
    }
]

def init_db():
    print("Creating database tables...")
    
    try:
        SQLModel.metadata.create_all(engine)
        print("Tables have been created successfully.")
    except Exception as e:
        print(f"ERROR (Creating Table): {e}")
        return

    try:
        with Session(engine) as session:
            for device_data in INITIAL_DEVICES:
                statement = select(Device).where(Device.name == device_data["name"])
                results = session.exec(statement)
                
                if not results.first():
                    dev = Device(**device_data)
                    session.add(dev)
                    print(f"Device added: {device_data['name']}")
                else:
                    print(f"The device already exists: {device_data['name']}")
            
            session.commit()
            print("Initial data was recorded.")

    except Exception as e:
        print(f"ERROR (Data Insertion): {e}")

if __name__ == "__main__":
    init_db()
