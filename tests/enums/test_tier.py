"""
Tests for TierEnum
"""

from enum import Enum

from api.app.enums import TierEnum


def test_tier_enum_values():
    """Test TierEnum values"""
    assert TierEnum.free.value == "FREE"
    assert TierEnum.pro.value == "PRO"


def test_tier_enum_str():
    """Test TierEnum string representation"""
    assert str(TierEnum.free) == "FREE"
    assert str(TierEnum.pro) == "PRO"


def test_tier_enum_members():
    """Test TierEnum members"""
    assert isinstance(TierEnum.free, Enum)
    assert isinstance(TierEnum.pro, Enum)
    assert len(list(TierEnum)) == 2
