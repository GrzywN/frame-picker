"""Processing related schemas"""

from typing import Optional

from pydantic import BaseModel, Field

from ...enums import ModeEnum, QualityEnum


class ProcessRequest(BaseModel):
    """Request model for video processing"""

    mode: ModeEnum = Field(
        default=ModeEnum.profile, description="Processing mode: profile or action"
    )
    quality: QualityEnum = Field(
        default=QualityEnum.balanced, description="Processing quality"
    )
    count: int = Field(
        default=1, ge=1, le=10, description="Number of frames to extract (1-10)"
    )
    sample_rate: int = Field(
        default=30, ge=1, le=60, description="Extract every Nth frame"
    )
    min_interval: float = Field(
        default=2.0,
        ge=0.5,
        le=10.0,
        description="Minimum interval between frames in seconds",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "mode": "profile",
                "quality": "balanced",
                "count": 3,
                "sample_rate": 30,
                "min_interval": 2.0,
            }
        }


class ProcessResponse(BaseModel):
    """Response model for processing requests"""

    session_id: str
    status: str
    message: str
    estimated_time: Optional[int] = None  # in seconds


class FrameResult(BaseModel):
    """Model for individual frame results"""

    frame_index: int
    score: float = Field(..., ge=0.0, le=1.0, description="Quality score (0.0-1.0)")
    timestamp: float = Field(..., ge=0.0, description="Frame timestamp in seconds")
    file_path: Optional[str] = None
    download_url: Optional[str] = None

    # Additional metadata
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None  # in bytes

    class Config:
        json_schema_extra = {
            "example": {
                "frame_index": 0,
                "score": 0.847,
                "timestamp": 12.5,
                "download_url": "/api/sessions/uuid/download/0",
                "width": 1920,
                "height": 1080,
                "file_size": 245760,
            }
        }
