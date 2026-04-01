import logging
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel, EmailStr
from uuid import uuid4
import os

from app.core.config import settings
from app.services.supabase_service import supabase_service
from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Auth Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    house: str = "gryffindor"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    username: str
    house: str
    message: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/health")
def health(): return {"status": "healthy", "service": "auth"}

@app.post("/api/v1/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    logger.info(f"Registering user: {req.email}")
    existing = await supabase_service.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = await supabase_service.create_user(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
        house=req.house
    )
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    token = create_access_token(user["id"], user["email"])
    return AuthResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
        house=user["house"],
        message=f"Welcome to CODUKU! You've been sorted into {req.house.title()}! 🧙"
    )

@app.post("/api/v1/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await supabase_service.get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(user["id"], user["email"])
    return AuthResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
        house=user["house"],
        message=f"Welcome back! 🧙"
    )

@app.get("/api/v1/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    user = await supabase_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    rank = await redis_service.get_user_rank("global", user_id)
    return {**user, "rank": rank}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    return {"error": str(exc), "status_code": 500, "message": "Internal server error"}
