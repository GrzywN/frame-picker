"""
Video processing endpoints
"""

from typing import List

from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..models import FrameResult, ProcessRequest, ProcessResponse
from ..services.processing_service import ProcessingService
from ..services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["processing"])
session_service = SessionService()
processing_service = ProcessingService()


@router.post("/{session_id}/process", response_model=ProcessResponse)
async def process_video(
    session_id: str, request: ProcessRequest, background_tasks: BackgroundTasks
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

        # Update session status to processing
        await session_service.update_session(
            session_id,
            {
                "status": "processing",
                "message": "Video processing started",
                "processing_params": request.model_dump(),
            },
        )

        # Start background processing
        background_tasks.add_task(
            processing_service.process_video_background,
            session_id,
            session["file_info"],
            request,
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
async def get_results(session_id: str):
    """Get processing results (best frames)"""
    try:
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.get("status") != "completed":
            raise HTTPException(status_code=400, detail="Processing not completed yet")

        results = session.get("results", [])

        return [FrameResult(**result) for result in results]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get results: {str(e)}")
