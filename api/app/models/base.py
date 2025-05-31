"""
Base model classes and common functionality
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BaseResponse(BaseModel):
    """Base response model with common fields"""

    message: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ErrorResponse(BaseResponse):
    """Model for error responses"""

    error: str
    session_id: Optional[str] = None


class HealthCheck(BaseResponse):
    """Model for health check response"""

    status: str
    version: str
