"""
Payment status enumeration
"""

from enum import Enum


class PaymentStatusEnum(str, Enum):
    """Payment status options"""

    pending = "PENDING"
    succeeded = "SUCCEEDED"
    failed = "FAILED"
    cancelled = "CANCELLED"
    refunded = "REFUNDED"

    def __str__(self) -> str:
        return self.value
