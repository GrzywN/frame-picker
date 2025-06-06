"""
Video upload endpoints
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from ..config import settings
from ..dependencies import get_session_service, get_video_service
from ..services.session_service import SessionService
from ..services.video_service import VideoService

router = APIRouter(prefix="/sessions", tags=["upload"])


@router.post("/{session_id}/upload")
async def upload_video(
    session_id: str,
    video: UploadFile = File(...),
    session_service: SessionService = Depends(get_session_service),
    video_service: VideoService = Depends(get_video_service),
):
    """Upload video file for processing"""
    try:
        # Validate session
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Validate file type
        if not video.content_type or not video.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="File must be a video")

        # Check file size (100MB limit for free tier)
        if video.size and video.size > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File size exceeds limit")

        # Save uploaded file and create database record
        file_info = await video_service.save_upload(session_id, video)

        # Update session with file info
        await session_service.update_session(
            session_id, {"status": "uploaded", "message": "Video uploaded successfully"}
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Video uploaded successfully",
                "session_id": session_id,
                "file_info": file_info,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
