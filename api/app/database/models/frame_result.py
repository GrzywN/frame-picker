"""FrameResult database model"""

import uuid as uuid_pkg

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..connection import Base


class FrameResult(Base):
    """Frame result model for extracted frames"""

    __tablename__ = "frame_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    processing_job_id = Column(
        UUID(as_uuid=True),
        ForeignKey("processing_jobs.id", ondelete="CASCADE"),
        nullable=False,
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
