"""
Frame Picker - AI-powered video frame selection for profile pictures and action shots
"""

__version__ = "0.1.0"
__author__ = "Karol Binkowski"

from .core import FrameExtractor, FrameSelector, FrameData
from .cli import main

__all__ = ["FrameExtractor", "FrameSelector", "FrameData", "main"]
