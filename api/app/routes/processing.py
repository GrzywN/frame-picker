"""Video processing endpoints"""

from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from ..dependencies import (
    get_current_user_optional,
    get_processing_service,
    get_session_service,
    get_usage_service,
)
from ..models import FrameResult, ProcessRequest, ProcessResponse
from ..models.auth import CurrentUser
from ..services.processing_service import ProcessingService
from ..services.session_service import SessionService
from ..services.usage_service import UsageService

router = APIRouter(prefix="/sessions", tags=["processing"])


@router.post("/{session_id}/process", response_model=ProcessResponse)
async def process_video(
    session_id: str,
    request: ProcessRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser = Depends(get_current_user_optional),
    session_service: SessionService = Depends(get_session_service),
    processing_service: ProcessingService = Depends(get_processing_service),
    usage_service: UsageService = Depends(get_usage_service),
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

        # Check usage limits
        if current_user:
            # Authenticated user - check monthly limits
            limits = usage_service.check_user_limits(current_user)
            if not limits["can_process"]:
                raise HTTPException(
                    status_code=429,
                    detail=f"Monthly limit exceeded. Used {limits['current_usage']}/{limits['limit']} videos this month.",
                )
        else:
            # Anonymous user - check daily limits
            limits = usage_service.check_anonymous_limits(session_id)
            if not limits["can_process"]:
                raise HTTPException(
                    status_code=429,
                    detail=f"Daily limit exceeded. Anonymous users can process {limits['limit']} video per day.",
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
