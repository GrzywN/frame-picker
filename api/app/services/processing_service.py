"""
Video processing service that integrates with frame_picker core logic
"""

import asyncio
import sys
from pathlib import Path
from typing import Any, Dict, List

from sqlalchemy.orm import Session as DBSession

# Ensure frame_picker is importable
project_root = Path(__file__).parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

try:
    from frame_picker.core import FrameData, FrameExtractor, FrameSelector

    FRAME_PICKER_AVAILABLE = True
except ImportError as e:
    FRAME_PICKER_AVAILABLE = False
    print(f"Warning: frame_picker core not available ({e}), using mock processing")

from ..config import settings
from ..models import FrameResult, ProcessRequest
from ..repositories.processing_repository import ProcessingRepository
from ..repositories.session_repository import SessionRepository
from ..repositories.video_repository import VideoRepository


class ProcessingService:
    """Handles video processing using frame_picker core logic"""

    def __init__(self, db: DBSession):
        self.db = db
        self.session_repo = SessionRepository(db)
        self.video_repo = VideoRepository(db)
        self.processing_repo = ProcessingRepository(db)

    async def create_processing_job(self, session_id: str, request: ProcessRequest):
        """Create a new processing job in database"""
        # Get session
        session = self.session_repo.get_by_session_id(session_id)
        if not session:
            raise ValueError("Session not found")

        # Get video file for this session
        video_files = self.video_repo.get_by_session_id(session.id)
        if not video_files:
            raise ValueError("No video file found for session")

        video_file = video_files[0]  # Take the first (and should be only) video file

        # Create processing job
        job = self.processing_repo.create_processing_job(
            session_id=session.id,
            video_file_id=video_file.id,
            params=request.model_dump(),
        )

        return job

    async def process_video_background(self, job_id: str, request: ProcessRequest):
        """Background task for video processing"""
        try:
            # Get processing job
            job = self.processing_repo.get_by_id(job_id)
            if not job:
                raise ValueError("Processing job not found")

            # Update job status
            self.processing_repo.update_job_status(job, "running", progress=10)

            # Update session status
            await self._update_session_status(
                job.session.session_id, "processing", "Starting video analysis...", 10
            )

            if FRAME_PICKER_AVAILABLE:
                results = await self._process_with_frame_picker(job, request)
            else:
                results = await self._mock_processing(job, request)

            # Update job as completed
            self.processing_repo.update_job_status(job, "completed", progress=100)

            # Update session with results
            await self._update_session_status(
                job.session.session_id,
                "completed",
                f"Processing completed successfully. Found {len(results)} frame(s).",
                100,
            )

        except Exception as e:
            # Update job as failed
            if "job" in locals():
                self.processing_repo.update_job_status(job, "failed", error=str(e))

                # Update session with error
                await self._update_session_status(
                    job.session.session_id,
                    "failed",
                    f"Processing failed: {str(e)}",
                    0,
                    str(e),
                )

            print(f"Processing error for job {job_id}: {e}")

    async def get_results(self, session_id: str) -> List[FrameResult]:
        """Get processing results for a session"""
        session = self.session_repo.get_by_session_id(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.status != "completed":
            raise ValueError("Processing not completed yet")

        # Get processing jobs for this session
        jobs = self.processing_repo.get_by_session_id(session.id)
        if not jobs:
            return []

        # Get the latest completed job
        completed_job = None
        for job in jobs:
            if job.status == "completed":
                completed_job = job
                break

        if not completed_job:
            return []

        # Convert frame results to FrameResult models
        results = []
        for frame_result in completed_job.frame_results:
            result = FrameResult(
                frame_index=frame_result.frame_index,
                score=frame_result.score,
                timestamp=frame_result.timestamp,
                file_path=frame_result.file_path,
                download_url=f"/api/sessions/{session_id}/download/{frame_result.frame_index}",
                width=frame_result.width,
                height=frame_result.height,
                file_size=frame_result.file_size,
            )
            results.append(result)

        # Sort by frame index
        results.sort(key=lambda x: x.frame_index)
        return results

    async def get_frame_file_path(self, session_id: str, frame_index: int) -> str:
        """Get file path for a specific frame"""
        session = self.session_repo.get_by_session_id(session_id)
        if not session:
            raise ValueError("Session not found")

        jobs = self.processing_repo.get_by_session_id(session.id)
        for job in jobs:
            if job.status == "completed":
                for frame_result in job.frame_results:
                    if frame_result.frame_index == frame_index:
                        return frame_result.file_path

        raise ValueError("Frame not found")

    async def _update_session_status(
        self,
        session_id: str,
        status: str,
        message: str,
        progress: int,
        error: str = None,
    ):
        """Update session status"""
        session = self.session_repo.get_by_session_id(session_id)
        if session:
            update_data = {"status": status, "message": message, "progress": progress}
            if error:
                update_data["error"] = error

            self.session_repo.update(session, **update_data)

    async def _process_with_frame_picker(
        self, job, request: ProcessRequest
    ) -> List[FrameResult]:
        """Process video using the actual frame_picker core logic"""
        video_file = job.video_file
        video_path = Path(video_file.file_path)

        # Create results directory for this session
        results_dir = settings.RESULTS_DIR / job.session.session_id
        results_dir.mkdir(exist_ok=True)

        # Update progress
        self.processing_repo.update_job_status(job, "running", progress=20)
        await self._update_session_status(
            job.session.session_id, "processing", "Extracting frames from video...", 20
        )

        # Initialize frame picker components
        extractor = FrameExtractor(sample_rate=request.sample_rate)
        selector = FrameSelector(mode=request.mode.value, quality=request.quality.value)

        # Extract frames
        frames = extractor.extract_frames(video_path)

        if not frames:
            raise Exception("No frames could be extracted from the video")

        # Update progress
        self.processing_repo.update_job_status(job, "running", progress=50)
        await self._update_session_status(
            job.session.session_id,
            "processing",
            f"Analyzing {len(frames)} frames...",
            50,
        )

        # Select best frames
        best_frames = selector.select_best_frames(
            frames, count=request.count, min_interval=request.min_interval
        )

        if not best_frames:
            raise Exception("Could not select suitable frames")

        # Update progress
        self.processing_repo.update_job_status(job, "running", progress=80)
        await self._update_session_status(
            job.session.session_id, "processing", "Saving selected frames...", 80
        )

        # Save frames and create results
        results = []
        for i, frame_data in enumerate(best_frames):
            # Apply tier restrictions
            processed_image = self._apply_tier_restrictions(
                frame_data["frame"].image,
                "free",  # TODO: Get user tier from session/auth
            )

            # Save frame
            filename = f"frame_{i+1:02d}.jpg"
            file_path = results_dir / filename

            # Save with appropriate quality
            quality = 85 if "free" == "free" else 95
            processed_image.save(str(file_path), "JPEG", quality=quality)

            # Get file size
            file_size = file_path.stat().st_size

            # Create frame result in database
            frame_result_data = {
                "frame_index": i,
                "score": float(frame_data["score"]),  # Konwersja np.float64 -> float
                "timestamp": float(frame_data["timestamp"]),  # Bezpieczna konwersja
                "file_path": str(file_path),
                "file_size": file_size,
                "width": processed_image.width,
                "height": processed_image.height,
            }

            self.processing_repo.add_frame_result(job.id, frame_result_data)

            # Create result for return
            result = FrameResult(
                frame_index=i,
                score=frame_data["score"],
                timestamp=frame_data["timestamp"],
                file_path=str(file_path),
                download_url=f"/api/sessions/{job.session.session_id}/download/{i}",
                width=processed_image.width,
                height=processed_image.height,
                file_size=file_size,
            )
            results.append(result)

        return results

    async def _mock_processing(self, job, request: ProcessRequest) -> List[FrameResult]:
        """Mock processing for development/testing"""
        import random

        from PIL import Image, ImageDraw, ImageFont

        # Create results directory for this session
        results_dir = settings.RESULTS_DIR / job.session.session_id
        results_dir.mkdir(exist_ok=True)

        # Simulate processing time
        await asyncio.sleep(2)

        # Update progress
        self.processing_repo.update_job_status(job, "running", progress=50)
        await self._update_session_status(
            job.session.session_id,
            "processing",
            "Mock processing - generating sample frames...",
            50,
        )

        # Create mock frames
        results = []
        video_duration = job.video_file.duration or 30.0

        for i in range(request.count):
            # Generate mock frame
            img = Image.new(
                "RGB",
                (640, 480),
                color=(
                    random.randint(100, 255),
                    random.randint(100, 255),
                    random.randint(100, 255),
                ),
            )
            draw = ImageDraw.Draw(img)

            # Add some text
            try:
                font = ImageFont.load_default()
                draw.text(
                    (50, 50), f"Mock Frame {i+1}", fill=(255, 255, 255), font=font
                )
                draw.text(
                    (50, 80),
                    f"Score: {random.uniform(0.7, 0.95):.3f}",
                    fill=(255, 255, 255),
                    font=font,
                )
            except:
                draw.text((50, 50), f"Mock Frame {i+1}", fill=(255, 255, 255))

            # Apply watermark for free tier
            img = self._apply_watermark(img, "free")

            # Save frame
            filename = f"frame_{i+1:02d}.jpg"
            file_path = results_dir / filename
            img.save(str(file_path), "JPEG", quality=85)

            # Create frame result in database
            frame_result_data = {
                "frame_index": i,
                "score": random.uniform(0.7, 0.95),
                "timestamp": random.uniform(0, video_duration),
                "file_path": str(file_path),
                "file_size": file_path.stat().st_size,
                "width": img.width,
                "height": img.height,
            }

            self.processing_repo.add_frame_result(job.id, frame_result_data)

            # Create result for return
            result = FrameResult(
                frame_index=i,
                score=frame_result_data["score"],
                timestamp=frame_result_data["timestamp"],
                file_path=str(file_path),
                download_url=f"/api/sessions/{job.session.session_id}/download/{i}",
                width=img.width,
                height=img.height,
                file_size=file_path.stat().st_size,
            )
            results.append(result)

        # Sort by timestamp
        results.sort(key=lambda x: x.timestamp)

        await asyncio.sleep(1)  # Simulate final processing

        return results

    def _apply_tier_restrictions(self, image, tier: str):
        """Apply restrictions based on user tier"""
        from PIL import Image

        if tier == "free":
            # Resize to 720p max
            if image.height > 720:
                ratio = 720 / image.height
                new_width = int(image.width * ratio)
                image = image.resize((new_width, 720), Image.Resampling.LANCZOS)

            # Apply watermark
            image = self._apply_watermark(image, tier)

        elif tier == "starter":
            # Resize to 1080p max
            if image.height > 1080:
                ratio = 1080 / image.height
                new_width = int(image.width * ratio)
                image = image.resize((new_width, 1080), Image.Resampling.LANCZOS)

        # Pro and Enterprise: no restrictions

        return image

    def _apply_watermark(self, image, tier: str):
        """Apply watermark for free tier"""
        if tier != "free":
            return image

        from PIL import Image, ImageDraw, ImageFont

        # Create watermark
        watermark = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(watermark)

        # Watermark text
        text = "FramePicker.ai"

        try:
            font = ImageFont.load_default()
        except:
            font = None

        # Get text dimensions
        if font:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        else:
            text_width = len(text) * 8  # Rough estimate
            text_height = 12

        # Position in bottom-right corner
        x = image.width - text_width - 20
        y = image.height - text_height - 20

        # Semi-transparent background
        draw.rectangle(
            [x - 5, y - 2, x + text_width + 5, y + text_height + 2], fill=(0, 0, 0, 128)
        )

        # Draw text
        draw.text((x, y), text, fill=(255, 255, 255, 200), font=font)

        # Composite with original image
        if image.mode != "RGBA":
            image = image.convert("RGBA")

        return Image.alpha_composite(image, watermark).convert("RGB")

    async def get_processing_estimate(
        self, file_info: Dict[str, Any], request: ProcessRequest
    ) -> int:
        """Estimate processing time in seconds"""
        # Base time estimation
        duration = file_info.get("duration", 30)
        frame_count = file_info.get("frame_count", 900)

        # Estimate based on video length and quality
        base_time = max(10, duration * 0.5)  # At least 10 seconds

        if request.quality == "fast":
            multiplier = 0.5
        elif request.quality == "balanced":
            multiplier = 1.0
        else:  # best
            multiplier = 2.0

        estimated_time = int(base_time * multiplier)

        return min(estimated_time, 180)  # Cap at 3 minutes
