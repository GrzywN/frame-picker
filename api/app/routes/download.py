"""
File download endpoints
"""

import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["download"])
session_service = SessionService()


@router.get("/{session_id}/download/{frame_index}")
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

        return FileResponse(
            path=file_path,
            filename=f"frame_{frame_index + 1}.jpg",
            media_type="image/jpeg",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")
