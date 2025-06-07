"""
Processing modes for video frame selection
"""

from enum import Enum


class ModeEnum(str, Enum):
    """Video processing modes"""

    profile = "profile"
    action = "action"

    def __str__(self) -> str:
        return self.value
