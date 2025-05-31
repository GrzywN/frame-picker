"""
FastAPI dependencies
"""

from fastapi import Depends
from sqlalchemy.orm import Session

from .database.connection import get_db
from .services.processing_service import ProcessingService
from .services.session_service import SessionService
from .services.video_service import VideoService


def get_session_service(db: Session = Depends(get_db)) -> SessionService:
    """Dependency for SessionService with database session"""
    return SessionService(db)


def get_video_service(db: Session = Depends(get_db)) -> VideoService:
    """Dependency for VideoService with database session"""
    return VideoService(db)


def get_processing_service(db: Session = Depends(get_db)) -> ProcessingService:
    """Dependency for ProcessingService with database session"""
    return ProcessingService(db)
