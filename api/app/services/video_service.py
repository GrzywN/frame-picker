"""
Video file handling service
"""

from pathlib import Path
from typing import Any, Dict

import aiofiles
import cv2
from fastapi import UploadFile

from ..config import settings


class VideoService:
    """Handles video file operations"""

    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.results_dir = settings.RESULTS_DIR

        # Ensure directories exist
        self.upload_dir.mkdir(exist_ok=True)
        self.results_dir.mkdir(exist_ok=True)

    async def save_upload(self, session_id: str, video: UploadFile) -> Dict[str, Any]:
        """
        Save uploaded video file and extract basic info
        """
        # Create session-specific directory
        session_dir = self.upload_dir / session_id
        session_dir.mkdir(exist_ok=True)

        # Generate safe filename
        safe_filename = self._generate_safe_filename(video.filename or "video.mp4")
        file_path = session_dir / safe_filename

        # Save file
        async with aiofiles.open(file_path, "wb") as f:
            content = await video.read()
            await f.write(content)

        # Extract video information
        video_info = self._extract_video_info(file_path)

        file_info = {
            "original_filename": video.filename,
            "safe_filename": safe_filename,
            "file_path": str(file_path),
            "file_size": len(content),
            "content_type": video.content_type,
            **video_info,
        }

        return file_info

    def _generate_safe_filename(self, filename: str) -> str:
        """Generate a safe filename"""
        # Remove any path separators and keep only the name + extension
        safe_name = Path(filename).name

        # Replace any remaining unsafe characters
        unsafe_chars = '<>:"/\\|?*'
        for char in unsafe_chars:
            safe_name = safe_name.replace(char, "_")

        return safe_name

    def _extract_video_info(self, file_path: Path) -> Dict[str, Any]:
        """
        Extract basic video information using OpenCV
        """
        info = {
            "duration": None,
            "fps": None,
            "width": None,
            "height": None,
            "frame_count": None,
            "format": None,
        }

        try:
            cap = cv2.VideoCapture(str(file_path))

            if cap.isOpened():
                # Get video properties
                fps = cap.get(cv2.CAP_PROP_FPS)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

                # Calculate duration
                duration = frame_count / fps if fps > 0 else None

                info.update(
                    {
                        "duration": duration,
                        "fps": fps,
                        "width": width,
                        "height": height,
                        "frame_count": frame_count,
                        "format": file_path.suffix.lower(),
                    }
                )

            cap.release()

        except Exception as e:
            print(f"Error extracting video info: {e}")

        return info

    def get_session_upload_dir(self, session_id: str) -> Path:
        """Get upload directory for a specific session"""
        return self.upload_dir / session_id

    def get_session_results_dir(self, session_id: str) -> Path:
        """Get results directory for a specific session"""
        session_results_dir = self.results_dir / session_id
        session_results_dir.mkdir(exist_ok=True)
        return session_results_dir

    async def cleanup_session_files(self, session_id: str):
        """Clean up all files for a session"""
        import shutil

        # Clean up upload directory
        upload_dir = self.get_session_upload_dir(session_id)
        if upload_dir.exists():
            try:
                shutil.rmtree(upload_dir)
            except Exception as e:
                print(f"Error cleaning up upload dir for {session_id}: {e}")

        # Clean up results directory
        results_dir = self.get_session_results_dir(session_id)
        if results_dir.exists():
            try:
                shutil.rmtree(results_dir)
            except Exception as e:
                print(f"Error cleaning up results dir for {session_id}: {e}")

    def validate_video_file(self, video: UploadFile) -> Dict[str, Any]:
        """
        Validate uploaded video file
        Returns validation result with any errors
        """
        validation = {"valid": True, "errors": []}

        # Check content type
        if not video.content_type or not video.content_type.startswith("video/"):
            validation["valid"] = False
            validation["errors"].append("File must be a video")

        # Check file size
        if video.size and video.size > settings.MAX_FILE_SIZE:
            validation["valid"] = False
            validation["errors"].append(
                f"File size exceeds {settings.MAX_FILE_SIZE / (1024*1024):.0f}MB limit"
            )

        # Check file extension
        if video.filename:
            ext = Path(video.filename).suffix.lower()
            allowed_extensions = [".mp4", ".avi", ".mov", ".quicktime", ".mkv"]
            if ext not in allowed_extensions:
                validation["valid"] = False
                validation["errors"].append(
                    f"File type {ext} not supported. Allowed: {', '.join(allowed_extensions)}"
                )

        return validation
