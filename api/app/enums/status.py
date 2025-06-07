"""
Session status types
"""

from enum import Enum


class StatusEnum(str, Enum):
    """Session status types"""

    created = "created"
    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"

    def __str__(self) -> str:
        return self.value
