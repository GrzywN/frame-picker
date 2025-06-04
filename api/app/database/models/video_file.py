"""VideoFile database model"""

import uuid as uuid_pkg

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..connection import Base


class VideoFile(Base):
    """Video file model for uploaded videos"""

    __tablename__ = "video_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    original_filename = Column(String(255), nullable=False)
    safe_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    content_type = Column(String(100))

    # Video metadata
    duration = Column(Float)
    fps = Column(Float)
    width = Column(Integer)
    height = Column(Integer)
    frame_count = Column(Integer)
    format = Column(String(50))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("Session", back_populates="video_files")
    processing_jobs = relationship("ProcessingJob", back_populates="video_file")
