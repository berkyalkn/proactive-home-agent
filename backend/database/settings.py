import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session
from pathlib import Path

env_path = Path(__file__).parent.parent / ".env"

load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session