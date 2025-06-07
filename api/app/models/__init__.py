"""
Pydantic models for Frame Picker API
"""

# Re-export enums for backward compatibility
from ..enums import ModeEnum, QualityEnum, StatusEnum, TierEnum

# Base models
from .base import BaseResponse, ErrorResponse, HealthCheck

# Schemas
from .schemas import CurrentUser  # Auth; Processing; Session; Video
from .schemas import (
    FrameResult,
    ProcessRequest,
    ProcessResponse,
    SessionCreate,
    SessionResponse,
    SessionStatus,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    VideoInfo,
    VideoUploadResponse,
)

__all__ = [
    # Base models
    "BaseResponse",
    "ErrorResponse",
    "HealthCheck",
    # Auth models
    "CurrentUser",
    "TokenResponse",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    # Processing models
    "FrameResult",
    "ProcessRequest",
    "ProcessResponse",
    # Session models
    "SessionCreate",
    "SessionResponse",
    "SessionStatus",
    # Video models
    "VideoInfo",
    "VideoUploadResponse",
    # Enums
    "ModeEnum",
    "QualityEnum",
    "StatusEnum",
    "TierEnum",
]
