from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from api.routers import sensors_router, devices_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Smart Home AI API")

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