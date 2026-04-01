from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache


class Settings(BaseSettings):
    # ===== API =====
    API_TITLE: str = "CODUKU Judge Service"
    API_VERSION: str = "2.0.0"
    API_PREFIX: str = "/api/v1"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8002
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ===== JWT =====
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 720

    # ===== Supabase =====
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # ===== Redis =====
    UPSTASH_REDIS_URL: str
    REDIS_NAMESPACE: str = "coduku"

    # ===== Judge0 =====
    JUDGE0_API_URL: str = "http://judge0:2358"
    JUDGE0_TIMEOUT: int = 10

    # ===== CORS =====
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    # ===== DB =====
    MONGODB_URL: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()