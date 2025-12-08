from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from api.routers import sensors_router, devices_router
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(sensors_router.router)
app.include_router(devices_router.router)

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed.")
    return {"message": "Smart Home AI API is running with MQTT Support"}