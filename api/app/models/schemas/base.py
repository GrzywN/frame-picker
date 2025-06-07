"""Base schemas for the application"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BaseResponse(BaseModel):
    """Base response model with common fields"""

    message: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ErrorResponse(BaseResponse):
    """Error response model"""

    error: str
    details: Optional[dict] = None


class SuccessResponse(BaseResponse):
    """Success response model"""

    success: bool = True
