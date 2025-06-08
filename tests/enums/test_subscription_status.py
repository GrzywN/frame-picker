"""
Tests for SubscriptionStatusEnum
"""

from enum import Enum

from api.app.enums import SubscriptionStatusEnum


def test_subscription_status_enum_values():
    """Test SubscriptionStatusEnum values"""
    assert SubscriptionStatusEnum.active.value == "ACTIVE"
    assert SubscriptionStatusEnum.inactive.value == "INACTIVE"
    assert SubscriptionStatusEnum.cancelled.value == "CANCELLED"
    assert SubscriptionStatusEnum.past_due.value == "PAST_DUE"
    assert SubscriptionStatusEnum.unpaid.value == "UNPAID"


def test_subscription_status_enum_str():
    """Test SubscriptionStatusEnum string representation"""
    assert str(SubscriptionStatusEnum.active) == "ACTIVE"
    assert str(SubscriptionStatusEnum.inactive) == "INACTIVE"
    assert str(SubscriptionStatusEnum.cancelled) == "CANCELLED"
    assert str(SubscriptionStatusEnum.past_due) == "PAST_DUE"
    assert str(SubscriptionStatusEnum.unpaid) == "UNPAID"


def test_subscription_status_enum_members():
    """Test SubscriptionStatusEnum members"""
    assert isinstance(SubscriptionStatusEnum.active, Enum)
    assert isinstance(SubscriptionStatusEnum.inactive, Enum)
    assert isinstance(SubscriptionStatusEnum.cancelled, Enum)
    assert isinstance(SubscriptionStatusEnum.past_due, Enum)
    assert isinstance(SubscriptionStatusEnum.unpaid, Enum)
    assert len(list(SubscriptionStatusEnum)) == 5
