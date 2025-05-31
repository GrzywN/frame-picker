"""
Video file repository
"""

from typing import List, Optional

from sqlalchemy.orm import Session as DBSession

from ..database.models import VideoFile
from .base import BaseRepository


class VideoRepository(BaseRepository[VideoFile]):
    """Repository for video file operations"""

    def __init__(self, db: DBSession):
        super().__init__(VideoFile, db)

    def get_by_session_id(self, session_id: str) -> List[VideoFile]:
        """Get video files by session ID"""
        return self.db.query(VideoFile).filter(VideoFile.session_id == session_id).all()

    def create_video_file(self, session_id: str, file_info: dict) -> VideoFile:
        """Create new video file record"""
        return self.create(
            session_id=session_id,
            original_filename=file_info.get("original_filename"),
            safe_filename=file_info.get("safe_filename"),
            file_path=file_info.get("file_path"),
            file_size=file_info.get("file_size"),
            content_type=file_info.get("content_type"),
            duration=file_info.get("duration"),
            fps=file_info.get("fps"),
            width=file_info.get("width"),
            height=file_info.get("height"),
            frame_count=file_info.get("frame_count"),
            format=file_info.get("format"),
        )
