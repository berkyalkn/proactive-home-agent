from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import sensors_router, devices_router

app = FastAPI(title="Smart Home AI API v2")

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
    return {"message": "HOMIFY API v2 is running"}