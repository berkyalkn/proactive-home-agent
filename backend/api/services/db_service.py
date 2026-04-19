from sqlmodel import Session, select
from database.settings import engine
from database.models import SensorReading, Device
import logging

logger = logging.getLogger(__name__)

def get_device_uuid_by_name(session: Session, device_name: str):
    statement = select(Device).where(Device.name == device_name)
    device = session.exec(statement).first()
    return device.id if device else None

def save_sensor_data(mqtt_data: dict):
    device_name = mqtt_data.get("device_id")
    if not device_name:
        return

    with Session(engine) as session:
        device_uuid = get_device_uuid_by_name(session, device_name)
        
        if not device_uuid:
            
            return

        try:
            readings_to_save = []

            if mqtt_data.get("temperature") is not None:
                readings_to_save.append(SensorReading(device_id=device_uuid, reading_type="temperature", value=float(mqtt_data["temperature"]), unit="C", source="sensor"))
            if mqtt_data.get("humidity") is not None:
                readings_to_save.append(SensorReading(device_id=device_uuid, reading_type="humidity", value=float(mqtt_data["humidity"]), unit="%", source="sensor"))
            if mqtt_data.get("light_level") is not None:
                readings_to_save.append(SensorReading(device_id=device_uuid, reading_type="light", value=float(mqtt_data["light_level"]), unit="lx", source="sensor"))
            if mqtt_data.get("pressure") is not None:
                readings_to_save.append(SensorReading(device_id=device_uuid, reading_type="pressure", value=float(mqtt_data["pressure"]), unit="hPa", source="sensor"))
            if mqtt_data.get("motion_detected") is not None:
                motion_val = 1.0 if mqtt_data["motion_detected"] else 0.0
                readings_to_save.append(SensorReading(device_id=device_uuid, reading_type="motion", value=motion_val, unit="bool", source="sensor"))

            if readings_to_save:
                session.add_all(readings_to_save)
                session.commit()
        except Exception as e:
            logger.error(f"Database Record Error: {e}")
            session.rollback()


def save_device_state(device_data: dict):
    """
    Records the status of the TAPO devices in the database.
    """
    device_name = device_data.get("device_id") 
    if not device_name:
        return

    with Session(engine) as session:
        statement = select(Device).where(Device.name == device_name)
        db_device = session.exec(statement).first()
        
        if not db_device:

            return

        try:
            readings_to_save = []
            
            if "state" in device_data:
                readings_to_save.append(SensorReading(device_id=db_device.id, reading_type="state", value=float(device_data["state"]), unit="bool", source="device_poll"))
            if "power" in device_data:
                readings_to_save.append(SensorReading(device_id=db_device.id, reading_type="power", value=float(device_data["power"]), unit="W", source="device_poll"))
            if "energy_today" in device_data:
                readings_to_save.append(SensorReading(device_id=db_device.id, reading_type="energy_today", value=float(device_data["energy_today"]), unit="kWh", source="device_poll"))
            if "energy_month" in device_data:
                readings_to_save.append(SensorReading(device_id=db_device.id, reading_type="energy_month", value=float(device_data["energy_month"]), unit="kWh", source="device_poll"))

            if readings_to_save:
                session.add_all(readings_to_save)
                session.commit()
                
        except Exception as e:
            logger.error(f"Device Registration Error: {e}")
            session.rollback()