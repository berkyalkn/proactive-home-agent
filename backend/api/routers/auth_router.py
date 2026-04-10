from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from database.settings import engine
from database.models import User
from api.services.auth_service import auth_service
from pydantic import BaseModel
from typing import Optional, List
from jose import JWTError, jwt
import api.services.auth_service as auth_conf

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UserRegister(BaseModel):
    username: str
    password: str
    role: Optional[str] = "user"
    face_embedding: Optional[List[float]] = None
    voice_embedding: Optional[List[float]] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_conf.SECRET_KEY, algorithms=[auth_conf.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if user is None:
            raise credentials_exception
        return user

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    with Session(engine) as session:
        existing_user = session.exec(select(User).where(User.username == user_data.username)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        hashed_pwd = auth_service.get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            role=user_data.role,
            face_embedding=user_data.face_embedding,
            voice_embedding=user_data.voice_embedding
        )

        session.add(new_user)
        session.commit()
        return {"message": f"User {user_data.username} registered successfully"}

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == form_data.username)).first()
        
        if not user or not auth_service.verify_password(form_data.password, "MODELDEN_GELECEK_HASH"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
            
        access_token = auth_service.create_access_token(data={"sub": user.username})
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "username": user.username
        }

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "has_face": current_user.face_embedding is not None,
        "has_voice": current_user.voice_embedding is not None,
        "last_seen": current_user.last_seen
    }