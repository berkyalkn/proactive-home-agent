from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from api.routers import sensors_router, devices_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application is starting... ")
    await devices_router.initialize_devices()
    yield
    logger.info("Application is closing...")

app = FastAPI(title="Smart Home AI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(sensors_router.router)
app.include_router(devices_router.router)

@app.get("/")
def read_root():
    logger.info("API root endpoint was hit!")
    return {"message": "HOMIFY API is running"}