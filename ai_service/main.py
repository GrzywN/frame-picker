"""
Frame Picker AI Service - Simplified FastAPI microservice for video processing
"""

import tempfile
import uuid
from pathlib import Path
from typing import List, Optional

import cv2
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .core.frame_extractor import FrameExtractor
from .core.frame_selector import FrameSelector

app = FastAPI(
    title="Frame Picker AI Service",
    description="AI-powered video frame extraction microservice",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary storage for processing
TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)


# Request/Response Models
class ProcessingRequest(BaseModel):
    mode: str = Field(
        default="profile", description="Processing mode: profile or action"
    )
    quality: str = Field(
        default="balanced", description="Quality: fast, balanced, best"
    )
    count: int = Field(
        default=1, ge=1, le=10, description="Number of frames to extract"
    )
    sample_rate: int = Field(
        default=30, ge=1, le=60, description="Sample every N frames"
    )
    min_interval: float = Field(
        default=2.0, ge=0.5, le=10.0, description="Min interval between frames"
    )


class FrameResult(BaseModel):
    frame_index: int
    score: float = Field(..., ge=0.0, le=1.0)
    timestamp: float = Field(..., ge=0.0)
    width: int
    height: int
    file_size: int


class ProcessingResponse(BaseModel):
    job_id: str
    video_info: dict
    results: List[FrameResult]
    processing_time: float


class VideoInfo(BaseModel):
    filename: str
    duration: Optional[float] = None
    fps: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    frame_count: Optional[int] = None


# Health check
@app.get("/")
async def health_check():
    return {"service": "Frame Picker AI", "status": "healthy", "version": "1.0.0"}


@app.get("/health")
async def detailed_health():
    return {
        "service": "Frame Picker AI",
        "status": "healthy",
        "features": {
            "opencv": True,
            "face_detection": True,
            "frame_extraction": True,
            "frame_selection": True,
        },
    }


@app.post("/extract-info", response_model=VideoInfo)
async def extract_video_info(
    video: UploadFile = File(..., description="Video file to analyze")
):
    """Extract basic video information without processing frames"""

    if not video.content_type or not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    # Create temporary file
    job_id = str(uuid.uuid4())
    temp_file = TEMP_DIR / f"{job_id}_{video.filename}"

    try:
        # Save uploaded file
        content = await video.read()
        with open(temp_file, "wb") as f:
            f.write(content)

        # Extract video info
        cap = cv2.VideoCapture(str(temp_file))

        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not read video file")

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else None

        cap.release()

        return VideoInfo(
            filename=video.filename,
            duration=duration,
            fps=fps,
            width=width,
            height=height,
            frame_count=frame_count,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process video: {str(e)}"
        )
    finally:
        # Cleanup
        if temp_file.exists():
            temp_file.unlink()


@app.post("/process", response_model=ProcessingResponse)
async def process_video(
    video: UploadFile = File(..., description="Video file to process"),
    mode: str = "profile",
    quality: str = "balanced",
    count: int = 1,
    sample_rate: int = 30,
    min_interval: float = 2.0,
):
    """Process video and extract best frames"""

    if not video.content_type or not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    # Validate parameters
    if mode not in ["profile", "action"]:
        raise HTTPException(
            status_code=400, detail="Mode must be 'profile' or 'action'"
        )

    if quality not in ["fast", "balanced", "best"]:
        raise HTTPException(
            status_code=400, detail="Quality must be 'fast', 'balanced', or 'best'"
        )

    if not 1 <= count <= 10:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 10")

    # Create job directory
    job_id = str(uuid.uuid4())
    job_dir = TEMP_DIR / job_id
    job_dir.mkdir(exist_ok=True)

    temp_video = job_dir / f"video_{video.filename}"

    try:
        import time

        start_time = time.time()

        # Save uploaded video
        content = await video.read()
        with open(temp_video, "wb") as f:
            f.write(content)

        # Extract video info first
        cap = cv2.VideoCapture(str(temp_video))
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not read video file")

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else None
        cap.release()

        video_info = {
            "filename": video.filename,
            "duration": duration,
            "fps": fps,
            "width": width,
            "height": height,
            "frame_count": frame_count,
            "file_size": len(content),
        }

        # Initialize processing components
        extractor = FrameExtractor(sample_rate=sample_rate)
        selector = FrameSelector(mode=mode, quality=quality)

        # Extract frames
        frames = extractor.extract_frames(temp_video)
        if not frames:
            raise HTTPException(
                status_code=400, detail="No frames could be extracted from video"
            )

        # Select best frames
        best_frames = selector.select_best_frames(
            frames, count=count, min_interval=min_interval
        )

        if not best_frames:
            raise HTTPException(
                status_code=400, detail="Could not select suitable frames"
            )

        # Save selected frames and create results
        results = []
        for i, frame_data in enumerate(best_frames):
            # Save frame
            frame_filename = f"frame_{i+1:02d}.jpg"
            frame_path = job_dir / frame_filename

            success = frame_data["frame"].save(str(frame_path))
            if not success:
                continue

            # Get file size
            file_size = frame_path.stat().st_size

            result = FrameResult(
                frame_index=i,
                score=float(frame_data["score"]),
                timestamp=float(frame_data["timestamp"]),
                width=frame_data["frame"].image.width,
                height=frame_data["frame"].image.height,
                file_size=file_size,
            )
            results.append(result)

        processing_time = time.time() - start_time

        return ProcessingResponse(
            job_id=job_id,
            video_info=video_info,
            results=results,
            processing_time=processing_time,
        )

    except Exception as e:
        # Cleanup on error
        if job_dir.exists():
            import shutil

            shutil.rmtree(job_dir)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.get("/download/{job_id}/{frame_index}")
async def download_frame(job_id: str, frame_index: int):
    """Download a specific processed frame"""

    job_dir = TEMP_DIR / job_id
    frame_path = job_dir / f"frame_{frame_index+1:02d}.jpg"

    if not frame_path.exists():
        raise HTTPException(status_code=404, detail="Frame not found")

    return FileResponse(
        path=str(frame_path),
        filename=f"frame_{frame_index+1}.jpg",
        media_type="image/jpeg",
    )


@app.delete("/cleanup/{job_id}")
async def cleanup_job(job_id: str):
    """Clean up temporary files for a job"""

    job_dir = TEMP_DIR / job_id

    if job_dir.exists():
        import shutil

        shutil.rmtree(job_dir)
        return {"message": f"Job {job_id} cleaned up successfully"}
    else:
        raise HTTPException(status_code=404, detail="Job not found")


def run_server():
    """Entry point for poetry script"""
    uvicorn.run(
        "ai_service.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info"
    )


if __name__ == "__main__":
    run_server()
