from sqlmodel import SQLModel, Session, select
from database.settings import engine
from database.models import Device, Room, User, SystemLog
import uuid

INITIAL_ROOMS = [
    {"name": "Living Room", "room_type": "livingroom"},
    {"name": "Bedroom", "room_type": "bedroom"},
    {"name": "Guestroom", "room_type": "guestroom"}
]

INITIAL_DEVICES = [
     {"name": "Plug1 (Oven)", "device_type": "outlet", "protocol": "tapo", "room_name": "Living Room", "ip_address": "192.168.0.22"},
     {"name": "Plug2 (Desk Lamp)", "device_type": "outlet", "protocol": "tapo", "room_name": "Living Room", "ip_address": "192.168.0.21"},
     {"name": "Living Room Bulb", "device_type": "bulb", "protocol": "tapo_bulb", "room_name": "Living Room", "ip_address": "192.168.0.27"},
     {"name": "Bedroom Bulb", "device_type": "bulb", "protocol": "tapo_bulb", "room_name": "Bedroom", "ip_address": "192.168.0.28"},
     {"name": "esp32_guestroom", "device_type": "sensor_node", "protocol": "mqtt", "room_name": "Guestroom", "ip_address": "192.168.0.20"},
     {"name": "esp32_livingroom", "device_type": "sensor_node", "protocol": "mqtt", "room_name": "Living Room", "ip_address": "192.168.0.17"},
     {"name": "esp32_bedroom", "device_type": "sensor_node", "protocol": "mqtt", "room_name": "Bedroom", "ip_address": "192.168.0.18"}
]

def init_db():

    print("Dropping old tables and creating new ones...")
    SQLModel.metadata.drop_all(engine) 

    print("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        room_map = {} 
        for r_data in INITIAL_ROOMS:
            existing_room = session.exec(select(Room).where(Room.name == r_data["name"])).first()
            if not existing_room:
                new_room = Room(**r_data)
                session.add(new_room)
                session.commit()
                session.refresh(new_room)
                room_map[r_data["name"]] = new_room.id
                print(f"Room created: {r_data['name']}")
            else:
                room_map[r_data["name"]] = existing_room.id

        for d_data in INITIAL_DEVICES:
            existing_dev = session.exec(select(Device).where(Device.name == d_data["name"])).first()
            if not existing_dev:
                room_name = d_data.pop("room_name") 
                target_room_id = room_map.get(room_name)
                
                if target_room_id:
                    dev = Device(**d_data, room_id=target_room_id)
                    session.add(dev)
                    print(f"Device added: {d_data['name']} to {room_name}")
                else:
                    print(f"Error: Room '{room_name}' not found for device {d_data['name']}")
            else:
                print(f"Device already exists: {d_data['name']}")
        
        session.commit()
        print("Initial database setup completed.")

if __name__ == "__main__":
    init_db()