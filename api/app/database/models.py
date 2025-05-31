"""
SQLAlchemy database models
"""

import uuid as uuid_pkg

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .connection import Base


class Session(Base):
    """Session model for tracking user sessions"""

    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    session_id = Column(String(255), unique=True, index=True, nullable=False)
    status = Column(String(50), nullable=False, default="created")
    message = Column(Text)
    progress = Column(Integer, default=0)
    error = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True))

    # Relationships
    video_files = relationship(
        "VideoFile", back_populates="session", cascade="all, delete-orphan"
    )
    processing_jobs = relationship(
        "ProcessingJob", back_populates="session", cascade="all, delete-orphan"
    )


class VideoFile(Base):
    """Video file model for uploaded videos"""

    __tablename__ = "video_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
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


class ProcessingJob(Base):
    """Processing job model for video analysis tasks"""

    __tablename__ = "processing_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    video_file_id = Column(
        UUID(as_uuid=True), ForeignKey("video_files.id"), nullable=False
    )

    # Processing parameters
    mode = Column(String(50), nullable=False)  # profile, action
    quality = Column(String(50), nullable=False)  # fast, balanced, best
    count = Column(Integer, nullable=False)
    sample_rate = Column(Integer, nullable=False)
    min_interval = Column(Float, nullable=False)

    # Job status
    status = Column(
        String(50), nullable=False, default="pending"
    )  # pending, running, completed, failed
    progress = Column(Integer, default=0)
    error = Column(Text)
    estimated_time = Column(Integer)  # in seconds

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    session = relationship("Session", back_populates="processing_jobs")
    video_file = relationship("VideoFile", back_populates="processing_jobs")
    frame_results = relationship(
        "FrameResult", back_populates="processing_job", cascade="all, delete-orphan"
    )


class FrameResult(Base):
    """Frame result model for extracted frames"""

    __tablename__ = "frame_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    processing_job_id = Column(
        UUID(as_uuid=True), ForeignKey("processing_jobs.id"), nullable=False
    )

    frame_index = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    timestamp = Column(Float, nullable=False)

    # File information
    file_path = Column(String(500))
    file_size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    processing_job = relationship("ProcessingJob", back_populates="frame_results")
