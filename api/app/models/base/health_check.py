"""Health check response model"""

from pydantic import BaseModel

from .response import BaseResponse


class HealthCheck(BaseResponse):
    """Model for health check response"""

    status: str
    version: str
