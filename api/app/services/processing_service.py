"""
Video processing service that integrates with frame_picker core logic
"""

import asyncio
import sys
from pathlib import Path
from typing import Dict, Any, List

# Ensure frame_picker is importable
project_root = Path(__file__).parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

try:
    from frame_picker.core import FrameExtractor, FrameSelector, FrameData
    FRAME_PICKER_AVAILABLE = True
except ImportError as e:
    FRAME_PICKER_AVAILABLE = False
    print(f"Warning: frame_picker core not available ({e}), using mock processing")

from ..config import settings
from ..models import ProcessRequest, FrameResult
from .session_service import SessionService
from .video_service import VideoService

class ProcessingService:
    """Handles video processing using frame_picker core logic"""
    
    def __init__(self):
        self.session_service = SessionService()
        self.video_service = VideoService()
    
    async def process_video_background(
        self, 
        session_id: str, 
        file_info: Dict[str, Any], 
        request: ProcessRequest
    ):
        """
        Background task for video processing
        """
        try:
            # Update session status
            await self.session_service.update_session(session_id, {
                "status": "processing",
                "message": "Starting video analysis...",
                "progress": 10
            })
            
            if FRAME_PICKER_AVAILABLE:
                results = await self._process_with_frame_picker(session_id, file_info, request)
            else:
                results = await self._mock_processing(session_id, file_info, request)
            
            # Update session with results
            await self.session_service.update_session(session_id, {
                "status": "completed",
                "message": f"Processing completed successfully. Found {len(results)} frame(s).",
                "progress": 100,
                "results": [result.model_dump() for result in results]
            })
            
        except Exception as e:
            # Update session with error
            await self.session_service.update_session(session_id, {
                "status": "failed",
                "message": f"Processing failed: {str(e)}",
                "progress": 0,
                "error": str(e)
            })
            print(f"Processing error for session {session_id}: {e}")
    
    async def _process_with_frame_picker(
        self, 
        session_id: str, 
        file_info: Dict[str, Any], 
        request: ProcessRequest
    ) -> List[FrameResult]:
        """
        Process video using the actual frame_picker core logic
        """
        video_path = Path(file_info["file_path"])
        results_dir = self.video_service.get_session_results_dir(session_id)
        
        # Update progress
        await self.session_service.update_session(session_id, {
            "message": "Extracting frames from video...",
            "progress": 20
        })
        
        # Initialize frame picker components
        extractor = FrameExtractor(sample_rate=request.sample_rate)
        selector = FrameSelector(mode=request.mode.value, quality=request.quality.value)
        
        # Extract frames
        frames = extractor.extract_frames(video_path)
        
        if not frames:
            raise Exception("No frames could be extracted from the video")
        
        # Update progress
        await self.session_service.update_session(session_id, {
            "message": f"Analyzing {len(frames)} frames...",
            "progress": 50
        })
        
        # Select best frames
        best_frames = selector.select_best_frames(
            frames, 
            count=request.count, 
            min_interval=request.min_interval
        )
        
        if not best_frames:
            raise Exception("Could not select suitable frames")
        
        # Update progress
        await self.session_service.update_session(session_id, {
            "message": "Saving selected frames...",
            "progress": 80
        })
        
        # Save frames and create results
        results = []
        for i, frame_data in enumerate(best_frames):
            # Apply tier restrictions
            processed_image = self._apply_tier_restrictions(
                frame_data['frame'].image, 
                "free"  # TODO: Get user tier from session/auth
            )
            
            # Save frame
            filename = f"frame_{i+1:02d}.jpg"
            file_path = results_dir / filename
            
            # Save with appropriate quality
            quality = 85 if "free" == "free" else 95
            processed_image.save(str(file_path), 'JPEG', quality=quality)
            
            # Get file size
            file_size = file_path.stat().st_size
            
            # Create result
            result = FrameResult(
                frame_index=i,
                score=frame_data['score'],
                timestamp=frame_data['timestamp'],
                file_path=str(file_path),
                download_url=f"/api/sessions/{session_id}/download/{i}",
                width=processed_image.width,
                height=processed_image.height,
                file_size=file_size
            )
            results.append(result)
        
        return results
    
    async def _mock_processing(
        self, 
        session_id: str, 
        file_info: Dict[str, Any], 
        request: ProcessRequest
    ) -> List[FrameResult]:
        """
        Mock processing for development/testing when frame_picker core is not available
        """
        import random
        from PIL import Image, ImageDraw, ImageFont
        
        results_dir = self.video_service.get_session_results_dir(session_id)
        
        # Simulate processing time
        await asyncio.sleep(2)
        
        # Update progress
        await self.session_service.update_session(session_id, {
            "message": "Mock processing - generating sample frames...",
            "progress": 50
        })
        
        # Create mock frames
        results = []
        video_duration = file_info.get("duration", 30.0)
        
        for i in range(request.count):
            # Generate mock frame
            img = Image.new('RGB', (640, 480), color=(random.randint(100, 255), random.randint(100, 255), random.randint(100, 255)))
            draw = ImageDraw.Draw(img)
            
            # Add some text
            try:
                font = ImageFont.load_default()
                draw.text((50, 50), f"Mock Frame {i+1}", fill=(255, 255, 255), font=font)
                draw.text((50, 80), f"Score: {random.uniform(0.7, 0.95):.3f}", fill=(255, 255, 255), font=font)
            except:
                draw.text((50, 50), f"Mock Frame {i+1}", fill=(255, 255, 255))
            
            # Apply watermark for free tier
            img = self._apply_watermark(img, "free")
            
            # Save frame
            filename = f"frame_{i+1:02d}.jpg"
            file_path = results_dir / filename
            img.save(str(file_path), 'JPEG', quality=85)
            
            # Create result
            result = FrameResult(
                frame_index=i,
                score=random.uniform(0.7, 0.95),
                timestamp=random.uniform(0, video_duration),
                file_path=str(file_path),
                download_url=f"/api/sessions/{session_id}/download/{i}",
                width=img.width,
                height=img.height,
                file_size=file_path.stat().st_size
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
        watermark = Image.new('RGBA', image.size, (0, 0, 0, 0))
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
        draw.rectangle([x-5, y-2, x+text_width+5, y+text_height+2], 
                      fill=(0, 0, 0, 128))
        
        # Draw text
        draw.text((x, y), text, fill=(255, 255, 255, 200), font=font)
        
        # Composite with original image
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        return Image.alpha_composite(image, watermark).convert('RGB')
    
    async def get_processing_estimate(self, file_info: Dict[str, Any], request: ProcessRequest) -> int:
        """
        Estimate processing time in seconds
        """
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