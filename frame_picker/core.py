"""
Core functionality for frame extraction and selection
"""

import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple

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


class FrameSelector:
    """Selects the best frame based on specified criteria"""

    def __init__(self, mode: str = "profile", quality: str = "balanced"):
        self.mode = mode.lower()
        self.quality = quality.lower()

        # Quality settings affect analysis depth
        self.quality_settings = {
            "fast": {"blur_threshold": 100, "face_min_size": 50},
            "balanced": {"blur_threshold": 150, "face_min_size": 30},
            "best": {"blur_threshold": 200, "face_min_size": 20},
        }

        self.settings = self.quality_settings[self.quality]

        # Load OpenCV face cascade
        try:
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
        except Exception:
            self.face_cascade = None

    def select_best_frames(
        self, frames: List[FrameData], count: int = 1, min_interval: float = 2.0
    ) -> List[Dict]:
        """
        Select the best N frames from the list with minimum time interval between them

        Args:
            frames: List of FrameData objects to analyze
            count: Number of best frames to return (default: 1)
            min_interval: Minimum time interval between selected frames in seconds (default: 2.0)

        Returns:
            List of dictionaries containing frame data, scores, and timestamps
        """
        if not frames:
            return []

        # Score all frames first
        scored_frames = []
        for frame_data in frames:
            score = self._score_frame(frame_data)
            scored_frames.append(
                {"frame": frame_data, "score": score, "timestamp": frame_data.timestamp}
            )

        # Sort by score (highest first)
        scored_frames.sort(key=lambda x: x["score"], reverse=True)

        # If only one frame requested, return the best one
        if count == 1:
            return scored_frames[:1] if scored_frames else []

        # Select frames with minimum interval constraint
        selected_frames = []

        for candidate in scored_frames:
            # Check if this frame is far enough from already selected frames
            is_valid = True
            for selected in selected_frames:
                time_diff = abs(candidate["timestamp"] - selected["timestamp"])
                if time_diff < min_interval:
                    is_valid = False
                    break

            if is_valid:
                selected_frames.append(candidate)

                # Stop if we have enough frames
                if len(selected_frames) >= count:
                    break

        # Sort selected frames by timestamp for consistent output
        selected_frames.sort(key=lambda x: x["timestamp"])

        return selected_frames

    def select_best_frame(self, frames: List[FrameData]) -> Optional[Dict]:
        """Select the best single frame from the list (backward compatibility)"""
        results = self.select_best_frames(frames, count=1)
        return results[0] if results else None

    def _score_frame(self, frame_data: FrameData) -> float:
        """Score a frame based on quality metrics"""
        cv_image = cv2.cvtColor(np.array(frame_data.image), cv2.COLOR_RGB2BGR)

        # Base quality metrics
        sharpness_score = self._calculate_sharpness(cv_image)
        brightness_score = self._calculate_brightness(cv_image)
        contrast_score = self._calculate_contrast(cv_image)

        # Mode-specific scoring
        if self.mode == "profile":
            face_score = self._calculate_face_score(cv_image)
            composition_score = self._calculate_composition_score(
                cv_image, focus="center"
            )
        else:  # action mode
            motion_score = self._calculate_motion_score(cv_image)
            composition_score = self._calculate_composition_score(
                cv_image, focus="dynamic"
            )
            face_score = 0.5  # Neutral face score for action shots

        # Weighted combination
        if self.mode == "profile":
            total_score = (
                sharpness_score * 0.3
                + brightness_score * 0.2
                + contrast_score * 0.2
                + face_score * 0.2
                + composition_score * 0.1
            )
        else:
            total_score = (
                sharpness_score * 0.25
                + brightness_score * 0.15
                + contrast_score * 0.2
                + motion_score * 0.25
                + composition_score * 0.15
            )

        return total_score

    def _calculate_sharpness(self, image: np.ndarray) -> float:
        """Calculate image sharpness using Laplacian variance"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Normalize to 0-1 range
        return min(laplacian_var / self.settings["blur_threshold"], 1.0)

    def _calculate_brightness(self, image: np.ndarray) -> float:
        """Calculate optimal brightness score"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)

        # Optimal brightness is around 127 (middle of 0-255 range)
        brightness_diff = abs(mean_brightness - 127) / 127
        return 1.0 - brightness_diff

    def _calculate_contrast(self, image: np.ndarray) -> float:
        """Calculate image contrast"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        contrast = gray.std()

        # Normalize contrast (typical range 0-80)
        return min(contrast / 80.0, 1.0)

    def _calculate_face_score(self, image: np.ndarray) -> float:
        """Calculate face detection score for profile mode"""
        if self.face_cascade is None:
            return 0.5  # Neutral score if face detection unavailable

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(self.settings["face_min_size"], self.settings["face_min_size"]),
        )

        if len(faces) == 0:
            return 0.1  # Low score for no faces
        elif len(faces) == 1:
            # Single face - check size and position
            x, y, w, h = faces[0]
            face_area = w * h
            image_area = image.shape[0] * image.shape[1]
            face_ratio = face_area / image_area

            # Prefer faces that take up 5-30% of the image
            if 0.05 <= face_ratio <= 0.3:
                return 1.0
            else:
                return 0.7
        else:
            return 0.6  # Multiple faces - decent but not ideal for profile

    def _calculate_motion_score(self, image: np.ndarray) -> float:
        """Calculate motion/action score for action mode"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Use edge detection to find areas of high activity
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])

        # Higher edge density suggests more action/motion
        return min(edge_density * 5, 1.0)  # Scale appropriately

    def _calculate_composition_score(self, image: np.ndarray, focus: str) -> float:
        """Calculate composition score based on focus type"""
        h, w = image.shape[:2]

        if focus == "center":
            # For profile pics, prefer centered subjects
            # This is a simplified rule of thirds check
            center_region = image[h // 3 : 2 * h // 3, w // 3 : 2 * w // 3]
            center_activity = cv2.cvtColor(center_region, cv2.COLOR_BGR2GRAY).std()
            return min(center_activity / 50.0, 1.0)
        else:  # dynamic
            # For action shots, prefer more distributed activity
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            # Check activity distribution across the image
            regions = [
                gray[0 : h // 2, 0 : w // 2],  # Top-left
                gray[0 : h // 2, w // 2 : w],  # Top-right
                gray[h // 2 : h, 0 : w // 2],  # Bottom-left
                gray[h // 2 : h, w // 2 : w],  # Bottom-right
            ]

            region_stds = [region.std() for region in regions]
            # Prefer images with activity in multiple regions
            active_regions = sum(1 for std in region_stds if std > 20)
            return active_regions / 4.0
