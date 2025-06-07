"""Base response model with common fields"""

from datetime import datetime

from pydantic import BaseModel, Field


class BaseResponse(BaseModel):
    """Base response model with common fields"""

    message: str
    timestamp: datetime = Field(default_factory=datetime.now)
