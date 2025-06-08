"""
Subscription status enumeration
"""

from enum import Enum


class SubscriptionStatusEnum(str, Enum):
    """Subscription status options"""

    active = "ACTIVE"
    inactive = "INACTIVE"
    cancelled = "CANCELLED"
    past_due = "PAST_DUE"
    unpaid = "UNPAID"

    def __str__(self) -> str:
        return self.value
