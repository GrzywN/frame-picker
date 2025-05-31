"""
Common enums and shared types
"""

from enum import Enum


class ModeEnum(str, Enum):
    """Video processing modes"""

    profile = "profile"
    action = "action"


class QualityEnum(str, Enum):
    """Processing quality levels"""

    fast = "fast"
    balanced = "balanced"
    best = "best"


class StatusEnum(str, Enum):
    """Session status types"""

    created = "created"
    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"
