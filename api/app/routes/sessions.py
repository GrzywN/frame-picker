"""
Session management endpoints
"""

import uuid

from fastapi import APIRouter, HTTPException

from ..models import SessionCreate, SessionResponse
from ..services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])
session_service = SessionService()


@router.post("", response_model=SessionResponse)
async def create_session():
    """Create a new session for video processing"""
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


@router.get("/{session_id}", response_model=SessionResponse)
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


@router.get("/{session_id}/status")
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


@router.delete("/{session_id}")
async def cleanup_session(session_id: str):
    """Clean up session and associated files"""
    try:
        await session_service.cleanup_session(session_id)
        return {"message": "Session cleaned up successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")
