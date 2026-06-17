import random
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, SQLModel, delete
from database.settings import engine
from database.models import BehavioralTelemetry

def generate_data(days_in_past=90):
    DEVICE_ID = "tapo-192.168.0.14" 
    start_date = datetime.now(timezone.utc) - timedelta(days=days_in_past)
    records = []
    
    print("Clearing old chaotic data...")
    with Session(engine) as session:
        session.exec(delete(BehavioralTelemetry))
        session.commit()

    print(f"Generating {days_in_past} days of SMART synthetic data...")
    
    for day_offset in range(days_in_past):
        current_date = start_date + timedelta(days=day_offset)
        day_of_week = current_date.weekday()
        
        for _ in range(5):
            hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            lux = random.uniform(10.0, 500.0)
            motion = random.choice([True, False])
            
            if motion and lux < 80.0:
                state = True 
            elif not motion:
                state = False 
            else:
                state = random.choices([True, False], weights=[0.2, 0.8])[0] 

            records.append(BehavioralTelemetry(
                timestamp=current_date.replace(hour=hour, minute=minute),
                day_of_week=day_of_week, hour_of_day=hour, minute_of_hour=minute,
                lux_level=lux, motion_detected=motion,
                target_device_id=DEVICE_ID, device_state=state, action_source="USER"
            ))

        if day_of_week == 3: 
            records.append(BehavioralTelemetry(
                timestamp=current_date.replace(hour=22, minute=random.randint(0, 10)),
                day_of_week=3, hour_of_day=22, minute_of_hour=random.randint(0, 10),
                lux_level=10.5, motion_detected=True, 
                target_device_id=DEVICE_ID, device_state=True, action_source="USER"
            ))
            
        if day_of_week == 4: 
            records.append(BehavioralTelemetry(
                timestamp=current_date.replace(hour=8, minute=random.randint(0, 15)),
                day_of_week=4, hour_of_day=8, minute_of_hour=random.randint(0, 15),
                lux_level=200.0, motion_detected=False, 
                target_device_id=DEVICE_ID, device_state=False, action_source="USER"
            ))

    with Session(engine) as session:
        session.bulk_save_objects(records)
        session.commit()
    print(f"Successfully inserted {len(records)} logical rows!")

if __name__ == "__main__":
    generate_data(90)