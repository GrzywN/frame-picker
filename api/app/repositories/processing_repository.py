"""
Processing job repository
"""

from typing import List, Optional

from sqlalchemy.orm import Session as DBSession

from ..database.models import FrameResult, ProcessingJob
from .base import BaseRepository


class ProcessingRepository(BaseRepository[ProcessingJob]):
    """Repository for processing job operations"""

    def __init__(self, db: DBSession):
        super().__init__(ProcessingJob, db)

    def create_processing_job(
        self, session_id: str, video_file_id: str, params: dict
    ) -> ProcessingJob:
        """Create new processing job"""
        return self.create(
            session_id=session_id,
            video_file_id=video_file_id,
            mode=params["mode"],
            quality=params["quality"],
            count=params["count"],
            sample_rate=params["sample_rate"],
            min_interval=params["min_interval"],
            status="pending",
        )

    def get_by_session_id(self, session_id: str) -> List[ProcessingJob]:
        """Get processing jobs by session ID"""
        return (
            self.db.query(ProcessingJob)
            .filter(ProcessingJob.session_id == session_id)
            .all()
        )

    def update_job_status(
        self, job: ProcessingJob, status: str, progress: int = None, error: str = None
    ) -> ProcessingJob:
        """Update processing job status"""
        update_data = {"status": status}

        if progress is not None:
            update_data["progress"] = progress
        if error is not None:
            update_data["error"] = error

        return self.update(job, **update_data)

    def add_frame_result(self, job_id: str, frame_data: dict) -> FrameResult:
        """Add frame result to processing job"""
        frame_result = FrameResult(
            processing_job_id=job_id,
            frame_index=frame_data["frame_index"],
            score=frame_data["score"],
            timestamp=frame_data["timestamp"],
            file_path=frame_data.get("file_path"),
            file_size=frame_data.get("file_size"),
            width=frame_data.get("width"),
            height=frame_data.get("height"),
        )

        self.db.add(frame_result)
        self.db.commit()
        self.db.refresh(frame_result)
        return frame_result
