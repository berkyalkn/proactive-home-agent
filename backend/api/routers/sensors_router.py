from fastapi import APIRouter
import random

router = APIRouter(prefix="/api/sensors", tags=["Mock Sensors"])

def get_mock_sensor_data():
    return {
        "temperature": round(random.uniform(22.0, 26.0), 1),
        "humidity": round(random.uniform(40.0, 60.0), 1),
        "pressure": round(random.uniform(1010.0, 1015.0), 1),
        "motion_detected": random.choice([True, False]),
        "light_level": round(random.uniform(100.0, 800.0), 1)
    }

@router.get("/all")
async def get_all_sensors():
    """Returns the most current mock data for all sensors"""
    return get_mock_sensor_data()