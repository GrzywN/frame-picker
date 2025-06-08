"""
Tests for PaymentStatusEnum
"""

from enum import Enum

from api.app.enums import PaymentStatusEnum


def test_payment_status_enum_values():
    """Test PaymentStatusEnum values"""
    assert PaymentStatusEnum.pending.value == "PENDING"
    assert PaymentStatusEnum.succeeded.value == "SUCCEEDED"
    assert PaymentStatusEnum.failed.value == "FAILED"
    assert PaymentStatusEnum.cancelled.value == "CANCELLED"
    assert PaymentStatusEnum.refunded.value == "REFUNDED"


def test_payment_status_enum_str():
    """Test PaymentStatusEnum string representation"""
    assert str(PaymentStatusEnum.pending) == "PENDING"
    assert str(PaymentStatusEnum.succeeded) == "SUCCEEDED"
    assert str(PaymentStatusEnum.failed) == "FAILED"
    assert str(PaymentStatusEnum.cancelled) == "CANCELLED"
    assert str(PaymentStatusEnum.refunded) == "REFUNDED"


def test_payment_status_enum_members():
    """Test PaymentStatusEnum members"""
    assert isinstance(PaymentStatusEnum.pending, Enum)
    assert isinstance(PaymentStatusEnum.succeeded, Enum)
    assert isinstance(PaymentStatusEnum.failed, Enum)
    assert isinstance(PaymentStatusEnum.cancelled, Enum)
    assert isinstance(PaymentStatusEnum.refunded, Enum)
    assert len(list(PaymentStatusEnum)) == 5
