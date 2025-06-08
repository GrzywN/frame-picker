"""
Configuration settings for Frame Picker API
"""

from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production

    # CORS Settings
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,http://localhost:3001,https://framepicker.ai,https://www.framepicker.ai"
    )

    # File Upload Settings
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB for free tier

    # Session Settings
    SESSION_EXPIRE_HOURS: int = 24

    # Storage Settings
    UPLOAD_DIR: Path = Path("uploads")
    RESULTS_DIR: Path = Path("results")

    # Database Settings
    DATABASE_URL: str = "postgresql://framepicker:postgres@localhost:5432/framepicker"

    # Stripe Configuration
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Stripe Price ID
    STRIPE_PRO_PRICE_ID: Optional[str] = None

    # Frontend URL (for Stripe redirects)
    FRONTEND_URL: str = "http://localhost:3000"

    # Authentication
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Email Configuration
    EMAIL_ENABLED: bool = False
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @property
    def allowed_origins(self) -> List[str]:
        """Get allowed origins for CORS"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENVIRONMENT == "development"

    @property
    def stripe_configured(self) -> bool:
        """Check if Stripe is properly configured"""
        return bool(
            self.STRIPE_SECRET_KEY
            and self.STRIPE_PUBLISHABLE_KEY
            and self.STRIPE_WEBHOOK_SECRET
        )

    def validate_stripe_config(self) -> None:
        """Validate Stripe configuration"""
        if not self.stripe_configured:
            raise ValueError(
                "Stripe configuration incomplete. Please set STRIPE_SECRET_KEY, "
                "STRIPE_PUBLISHABLE_KEY, and STRIPE_WEBHOOK_SECRET in your .env file."
            )

    def get_tier_limits(self, tier: str) -> dict:
        """Get limits for a specific tier"""
        limits = {
            "free": {
                "videos_per_month": 3,
                "frames_per_video": 3,
                "max_file_size": 50 * 1024 * 1024,  # 50MB
                "max_resolution": "720p",
                "has_watermark": True,
                "priority_processing": False,
                "api_access": False,
                "price": 0,
                "name": "Free",
                "description": "Perfect for trying out Frame Picker",
            },
            "pro": {
                "videos_per_month": 100,
                "frames_per_video": 10,
                "max_file_size": 500 * 1024 * 1024,  # 500MB
                "max_resolution": "1080p",
                "has_watermark": False,
                "priority_processing": True,
                "api_access": True,
                "price": 299,  # $2.99 in cents
                "name": "Pro",
                "description": "For content creators and professionals",
            },
        }
        return limits.get(tier.lower(), limits["free"])


def get_project_root() -> Path:
    """Get the project root directory"""
    return Path(__file__).parent.parent.parent


settings = Settings()

# Ensure directories exist
project_root = get_project_root()
if not settings.UPLOAD_DIR.is_absolute():
    settings.UPLOAD_DIR = project_root / settings.UPLOAD_DIR
if not settings.RESULTS_DIR.is_absolute():
    settings.RESULTS_DIR = project_root / settings.RESULTS_DIR

settings.UPLOAD_DIR.mkdir(exist_ok=True)
settings.RESULTS_DIR.mkdir(exist_ok=True)
