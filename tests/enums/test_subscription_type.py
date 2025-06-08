"""
Tests for SubscriptionTypeEnum
"""

from enum import Enum

from api.app.enums import SubscriptionTypeEnum


def test_subscription_type_enum_values():
    """Test SubscriptionTypeEnum values"""
    assert SubscriptionTypeEnum.monthly.value == "MONTHLY"
    assert SubscriptionTypeEnum.yearly.value == "YEARLY"


def test_subscription_type_enum_str():
    """Test SubscriptionTypeEnum string representation"""
    assert str(SubscriptionTypeEnum.monthly) == "MONTHLY"
    assert str(SubscriptionTypeEnum.yearly) == "YEARLY"


def test_subscription_type_enum_members():
    """Test SubscriptionTypeEnum members"""
    assert isinstance(SubscriptionTypeEnum.monthly, Enum)
    assert isinstance(SubscriptionTypeEnum.yearly, Enum)
    assert len(list(SubscriptionTypeEnum)) == 2
