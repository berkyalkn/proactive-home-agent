from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from api.routers import sensors_router, devices_router, chat_router, user_router, vision_router, auth_router, onboarding_router, rooms_router, discovery_router
from api.drivers import mqtt_service
from api.services import tapo_poller

import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application is starting... ")
    await devices_router.initialize_devices()
    mqtt_service.start_mqtt_service()
    poller_task = asyncio.create_task(tapo_poller.poll_tapo_devices())
    yield
    logger.info("Application is closing...")

    mqtt_service.stop_mqtt_service()
    
    poller_task.cancel()
    try:
        await poller_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Smart Home AI API", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://100.105.136.5:3000",
    "http://raspberrypi.local:3000",
    "http://192.168.0.23:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(sensors_router.router)
app.include_router(devices_router.router)
app.include_router(chat_router.router)
app.include_router(user_router.router)
app.include_router(vision_router.router)
app.include_router(auth_router.router)
app.include_router(onboarding_router.router)
app.include_router(rooms_router.router)
app.include_router(discovery_router.router)

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed.")
    return {"message": "Smart Home AI API is running with MQTT Support"}