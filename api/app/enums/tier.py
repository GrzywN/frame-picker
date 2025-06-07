from enum import Enum


class TierEnum(str, Enum):
    """User tier types"""

    free = "FREE"
    pro = "PRO"

    def __str__(self) -> str:
        return self.value
