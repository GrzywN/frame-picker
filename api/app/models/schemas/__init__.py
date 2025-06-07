"""Pydantic schemas for the application"""

# Base models
# Auth models
from .auth import CurrentUser, TokenResponse, UserCreate, UserLogin, UserResponse
from .base import BaseResponse, ErrorResponse, SuccessResponse

# Processing models
from .processing import FrameResult, ProcessRequest, ProcessResponse

# Session models
from .session import SessionCreate, SessionResponse, SessionStatus

# Video models
from .video import VideoInfo, VideoUploadResponse

__all__ = [
    # Base models
    "BaseResponse",
    "ErrorResponse",
    "SuccessResponse",
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
]
