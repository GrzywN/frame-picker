"""
Subscription type enumeration
"""

from enum import Enum


class SubscriptionTypeEnum(str, Enum):
    """Subscription type options"""

    monthly = "MONTHLY"
    yearly = "YEARLY"

    def __str__(self) -> str:
        return self.value
