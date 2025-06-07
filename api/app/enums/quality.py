"""
Quality levels for video frame processing
"""

from enum import Enum


class QualityEnum(str, Enum):
    """Processing quality levels"""

    fast = "fast"
    balanced = "balanced"
    best = "best"

    def __str__(self) -> str:
        return self.value
