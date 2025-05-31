"""
Frame Picker API - FastAPI backend
"""

import os
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .models import (
    FrameResult,
    ProcessRequest,
    ProcessResponse,
    SessionCreate,
    SessionResponse,
)
from .services.processing_service import ProcessingService
from .services.session_service import SessionService
from .services.video_service import VideoService

# Initialize FastAPI app
app = FastAPI(
    title="Frame Picker API",
    description="AI-powered video frame selection API",
    version="0.1.0",
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
session_service = SessionService()
video_service = VideoService()
processing_service = ProcessingService()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Frame Picker API", "version": "0.1.0", "status": "healthy"}


@app.post("/api/sessions", response_model=SessionResponse)
async def create_session():
    """
    Create a new session for video processing
    Returns a UUID that should be used for all subsequent requests
    """
    try:
        session_id = str(uuid.uuid4())
        session = await session_service.create_session(session_id)

        return SessionResponse(
            session_id=session_id,
            status="created",
            message="Session created successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create session: {str(e)}"
        )


@app.get("/api/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session status and information"""
    try:
        session = await session_service.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return SessionResponse(
            session_id=session_id,
            status=session.get("status", "unknown"),
            message=session.get("message", ""),
            created_at=session.get("created_at"),
            expires_at=session.get("expires_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")


@app.post("/api/sessions/{session_id}/upload")
async def upload_video(
    session_id: str,
    video: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Upload video file for processing
    """
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

        # Save uploaded file
        file_info = await video_service.save_upload(session_id, video)

        # Update session with file info
        await session_service.update_session(
            session_id,
            {
                "status": "uploaded",
                "message": "Video uploaded successfully",
                "file_info": file_info,
            },
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


@app.post("/api/sessions/{session_id}/process", response_model=ProcessResponse)
async def process_video(
    session_id: str, request: ProcessRequest, background_tasks: BackgroundTasks
):
    """
    Start video processing with specified parameters
    """
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
            estimated_time=30,  # seconds
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.get("/api/sessions/{session_id}/status")
async def get_processing_status(session_id: str):
    """Get current processing status"""
    try:
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "session_id": session_id,
            "status": session.get("status", "unknown"),
            "message": session.get("message", ""),
            "progress": session.get("progress", 0),
            "results": session.get("results"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@app.get("/api/sessions/{session_id}/results", response_model=List[FrameResult])
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


@app.get("/api/sessions/{session_id}/download/{frame_index}")
async def download_frame(session_id: str, frame_index: int):
    """Download a specific frame"""
    try:
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        results = session.get("results", [])
        if frame_index >= len(results) or frame_index < 0:
            raise HTTPException(status_code=404, detail="Frame not found")

        frame_data = results[frame_index]
        file_path = frame_data.get("file_path")

        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Frame file not found")

        # Return file for download
        from fastapi.responses import FileResponse

        return FileResponse(
            path=file_path,
            filename=f"frame_{frame_index + 1}.jpg",
            media_type="image/jpeg",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@app.delete("/api/sessions/{session_id}")
async def cleanup_session(session_id: str):
    """Clean up session and associated files"""
    try:
        await session_service.cleanup_session(session_id)

        return {"message": "Session cleaned up successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


def run_server():
    """Entry point for poetry script"""
    import uvicorn

    from api.app.config import settings

    uvicorn.run(
        "api.app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )


if __name__ == "__main__":
    import uvicorn

    run_server()
