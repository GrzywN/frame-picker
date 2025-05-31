"""
Configuration settings for Frame Picker API
"""

from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False

    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",  # Alternative port
        "https://framepicker.ai",  # Production domain
        "https://www.framepicker.ai",
    ]

    # File Upload Settings
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB for free tier

    # Storage Settings
    UPLOAD_DIR: Path = Path("uploads")
    RESULTS_DIR: Path = Path("results")

    # Free Tier Limits (for the future)
    # FREE_TIER_MAX_FRAMES: int = 3
    # FREE_TIER_MAX_VIDEO_LENGTH: int = 60  # seconds
    # FREE_TIER_QUALITY: str = "720p"

    # Database Settings
    DATABASE_URL: str = "postgresql://framepicker:postgres@localhost:5432/framepicker"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


def get_project_root() -> Path:
    """Get the project root directory"""
    return Path(__file__).parent.parent.parent


settings = Settings()

project_root = get_project_root()
if not settings.UPLOAD_DIR.is_absolute():
    settings.UPLOAD_DIR = project_root / settings.UPLOAD_DIR
if not settings.RESULTS_DIR.is_absolute():
    settings.RESULTS_DIR = project_root / settings.RESULTS_DIR

settings.UPLOAD_DIR.mkdir(exist_ok=True)
settings.RESULTS_DIR.mkdir(exist_ok=True)
