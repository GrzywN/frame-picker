"""
Video processing endpoints
"""

from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from ..dependencies import get_processing_service, get_session_service
from ..models import FrameResult, ProcessRequest, ProcessResponse
from ..services.processing_service import ProcessingService
from ..services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["processing"])


@router.post("/{session_id}/process", response_model=ProcessResponse)
async def process_video(
    session_id: str,
    request: ProcessRequest,
    background_tasks: BackgroundTasks,
    session_service: SessionService = Depends(get_session_service),
    processing_service: ProcessingService = Depends(get_processing_service),
):
    """Start video processing with specified parameters"""
    try:
        # Validate session and check if video is uploaded
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.get("status") != "uploaded":
            raise HTTPException(
                status_code=400, detail="No video uploaded for this session"
            )

        # Create processing job in database
        job = await processing_service.create_processing_job(session_id, request)

        # Update session status to processing
        await session_service.update_session(
            session_id, {"status": "processing", "message": "Video processing started"}
        )

        # Start background processing
        background_tasks.add_task(
            processing_service.process_video_background, job.id, request
        )

        return ProcessResponse(
            session_id=session_id,
            status="processing",
            message="Video processing started",
            estimated_time=30,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/{session_id}/results", response_model=List[FrameResult])
async def get_results(
    session_id: str,
    processing_service: ProcessingService = Depends(get_processing_service),
):
    """Get processing results (best frames)"""
    try:
        results = await processing_service.get_results(session_id)
        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get results: {str(e)}")
