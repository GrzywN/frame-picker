"""ProcessingJob database model"""

import uuid as uuid_pkg

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..connection import Base


class ProcessingJob(Base):
    """Processing job model for video analysis tasks"""

    __tablename__ = "processing_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    video_file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("video_files.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Processing parameters
    mode = Column(String(50), nullable=False)
    quality = Column(String(50), nullable=False)
    count = Column(Integer, nullable=False)
    sample_rate = Column(Integer, nullable=False)
    min_interval = Column(Float, nullable=False)

    # Job status
    status = Column(String(50), nullable=False, default="pending")
    progress = Column(Integer, default=0)
    error = Column(Text)
    estimated_time = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    session = relationship("Session", back_populates="processing_jobs")
    video_file = relationship("VideoFile", back_populates="processing_jobs")
    frame_results = relationship(
        "FrameResult", back_populates="processing_job", cascade="all, delete-orphan"
    )
