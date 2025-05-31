"""
Configuration settings for Frame Picker API
"""

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List

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
        "https://framepicker.ai", # Production domain
        "https://www.framepicker.ai"
    ]
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB for free tier
    ALLOWED_VIDEO_TYPES: List[str] = [
        "video/mp4",
        "video/avi", 
        "video/mov",
        "video/quicktime",
        "video/x-msvideo"
    ]
    
    # Storage Settings
    UPLOAD_DIR: Path = Path("uploads")
    RESULTS_DIR: Path = Path("results")
    
    # Redis Settings (for session storage)
    REDIS_URL: str = "redis://localhost:6379/0"
    SESSION_EXPIRE_HOURS: int = 24
    
    # Celery Settings (for background processing)
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Processing Settings
    DEFAULT_SAMPLE_RATE: int = 30
    DEFAULT_QUALITY: str = "balanced"
    DEFAULT_MODE: str = "profile"
    DEFAULT_FRAME_COUNT: int = 1
    DEFAULT_MIN_INTERVAL: float = 2.0
    
    # Free Tier Limits
    FREE_TIER_MAX_FRAMES: int = 3
    FREE_TIER_MAX_VIDEO_LENGTH: int = 60  # seconds
    FREE_TIER_QUALITY: str = "720p"
    
    # AWS S3 Settings (optional, for production)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = ""
    
    # Database Settings (for future user management)
    DATABASE_URL: str = "postgresql://user:password@localhost/framepicker"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

def get_project_root() -> Path:
    """Get the project root directory"""
    return Path(__file__).parent.parent.parent

# Global settings instance
settings = Settings()

# Set up directories relative to project root
project_root = get_project_root()
if not settings.UPLOAD_DIR.is_absolute():
    settings.UPLOAD_DIR = project_root / settings.UPLOAD_DIR
if not settings.RESULTS_DIR.is_absolute():
    settings.RESULTS_DIR = project_root / settings.RESULTS_DIR

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(exist_ok=True)
settings.RESULTS_DIR.mkdir(exist_ok=True)