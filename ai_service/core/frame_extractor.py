"""
Frame extraction functionality
"""

from pathlib import Path
from typing import List

import cv2
import numpy as np
from PIL import Image


class FrameData:
    """Container for frame data and metadata"""

    def __init__(self, image: Image.Image, timestamp: float, frame_number: int):
        self.image = image
        self.timestamp = timestamp
        self.frame_number = frame_number

    def save(self, path: str) -> bool:
        """Save frame to file"""
        try:
            self.image.save(path, "JPEG", quality=95)
            return True
        except Exception:
            return False


class FrameExtractor:
    """Extracts frames from video files"""

    def __init__(self, sample_rate: int = 30):
        self.sample_rate = sample_rate

    def extract_frames(self, video_path: Path) -> List[FrameData]:
        """Extract frames from video at specified sample rate"""
        frames = []

        try:
            cap = cv2.VideoCapture(str(video_path))

            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {video_path}")

            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            frame_number = 0

            while True:
                ret, frame = cap.read()

                if not ret:
                    break

                # Sample frames at specified rate
                if frame_number % self.sample_rate == 0:
                    # Convert BGR to RGB and create PIL Image
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_image = Image.fromarray(rgb_frame)

                    timestamp = frame_number / fps if fps > 0 else 0

                    frame_data = FrameData(
                        image=pil_image, timestamp=timestamp, frame_number=frame_number
                    )

                    frames.append(frame_data)

                frame_number += 1

            cap.release()

        except Exception as e:
            raise RuntimeError(f"Error extracting frames: {str(e)}")

        return frames
