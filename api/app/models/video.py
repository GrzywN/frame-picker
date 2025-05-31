"""
Video-related models
"""

from typing import Optional

from pydantic import BaseModel


class VideoInfo(BaseModel):
    """Model for video file information"""

    filename: str
    size: int  # in bytes
    duration: Optional[float] = None  # in seconds
    fps: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None


class VideoUploadResponse(BaseModel):
    """Response model for video upload"""

    message: str
    session_id: str
    file_info: dict
