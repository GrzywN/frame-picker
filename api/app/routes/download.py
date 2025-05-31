"""
File download endpoints
"""

import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from ..dependencies import get_processing_service
from ..services.processing_service import ProcessingService

router = APIRouter(prefix="/sessions", tags=["download"])


@router.get("/{session_id}/download/{frame_index}")
async def download_frame(
    session_id: str,
    frame_index: int,
    processing_service: ProcessingService = Depends(get_processing_service),
):
    """Download a specific frame"""
    try:
        file_path = await processing_service.get_frame_file_path(
            session_id, frame_index
        )

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
