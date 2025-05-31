"""
Frame Picker - AI-powered video frame selection for profile pictures and action shots
"""

__version__ = "0.1.0"
__author__ = "Karol Binkowski"

from .cli import main
from .core import FrameData, FrameExtractor, FrameSelector

__all__ = ["FrameExtractor", "FrameSelector", "FrameData", "main"]
