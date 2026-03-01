from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Football Journal"
    ENV: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    ALEMBIC_DATABASE_URL: str = os.getenv("ALEMBIC_DATABASE_URL")

    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    CLERK_PUBLISHABLE_KEY: str = os.getenv("CLERK_PUBLISHABLE_KEY")
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY")
    JWKS_URL: str = os.getenv("JWKS_URL")
    CLERK_FRONTEND_URL: str = os.getenv("CLERK_FRONTEND_URL")

    # External APIs
    FOOTBALL_DATA_API_KEY: str | None = os.getenv("FOOTBALL_DATA_API_KEY")
    FOOTBALL_DATA_BASE_URL: str = "https://api.football-data.org/v4/"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings():
    return Settings()
