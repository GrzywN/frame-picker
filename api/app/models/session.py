"""
Session-related models
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .base import BaseResponse
from .processing import ProcessRequest
from .video import VideoInfo


class SessionCreate(BaseModel):
    """Request model for creating a new session"""

    pass


class SessionResponse(BaseResponse):
    """Response model for session operations"""

    session_id: str
    status: str
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class SessionStatus(BaseModel):
    """Model for session status response"""

    session_id: str
    status: str
    message: str
    progress: int = Field(
        default=0, ge=0, le=100, description="Processing progress percentage"
    )
    video_info: Optional[VideoInfo] = None
    processing_params: Optional[ProcessRequest] = None
    results: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
