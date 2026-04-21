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
import numpy as np
import base64
import cv2

from api.services.vision_service import vision_service

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UserRegister(BaseModel):
    username: str
    email: str 
    password: str
    role: Optional[str] = "user"

class BiometricLoginRequest(BaseModel):
    image_base64: str


class ForgotPasswordRequest(BaseModel):
    email: str


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
        if session.exec(select(User).where(User.username == user_data.username)).first():
            raise HTTPException(status_code=400, detail="Username already taken.")
        
        if session.exec(select(User).where(User.email == user_data.email)).first():
            raise HTTPException(status_code=400, detail="Email already registered.")
        
        hashed_pwd = auth_service.get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_pwd,
            role=user_data.role
        )
        session.add(new_user)
        session.commit()
        return {"message": "User registered successfully"}


def base64_to_cv2(base64_string):
    """Converts a Base64 string to OpenCV format."""

    encoded_data = base64_string.split(',')[1] if ',' in base64_string else base64_string
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)



@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == form_data.username)).first()
        
        if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
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

@router.post("/biometric-login", response_model=TokenResponse)
async def biometric_login(request: BiometricLoginRequest):
    try:
        img = base64_to_cv2(request.image_base64)
        
        result = vision_service.recognize(img, is_cropped=False)
        
        if not result["face_found"]:
            raise HTTPException(
                status_code=400, 
                detail="No face detected. Please ensure you are in a well-lit area and looking at the camera."
            )
            
        if result["name"] == "Unknown":
            raise HTTPException(
                status_code=401, 
                detail="Face not recognized. If you are a new user, please log in with your password to complete your Face ID setup."
            )
            
        username = result["name"]
        
        access_token = auth_service.create_access_token(data={"sub": username})
        return {"access_token": access_token, "token_type": "bearer", "username": username}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Biometric processing failed: {str(e)}")


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            raise HTTPException(
                status_code=404, 
                detail="This email address is not registered in our system."
            )
        
        return {"message": f"Password reset instructions have been sent to {request.email}"}


@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role,
        "is_onboarding_complete": current_user.is_onboarding_complete,
        "has_face": current_user.face_embedding is not None,
        "has_voice": current_user.voice_embedding is not None,
        "last_seen": current_user.last_seen
    }