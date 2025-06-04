"""Session database model"""

import uuid as uuid_pkg

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..connection import Base


class Session(Base):
    """Session model for tracking user sessions"""

    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    session_id = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status = Column(String(50), nullable=False, default="created")
    message = Column(Text)
    progress = Column(Integer, default=0)
    error = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="sessions")
    video_files = relationship(
        "VideoFile", back_populates="session", cascade="all, delete-orphan"
    )
    processing_jobs = relationship(
        "ProcessingJob", back_populates="session", cascade="all, delete-orphan"
    )
