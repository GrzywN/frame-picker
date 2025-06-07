"""
Tests for ModeEnum
"""

from enum import Enum

from api.app.enums.mode import ModeEnum


def test_mode_enum_values():
    """Test ModeEnum values"""
    assert ModeEnum.profile.value == "profile"
    assert ModeEnum.action.value == "action"


def test_mode_enum_str():
    """Test ModeEnum string representation"""
    assert str(ModeEnum.profile) == "profile"
    assert str(ModeEnum.action) == "action"


def test_mode_enum_members():
    """Test ModeEnum members"""
    assert isinstance(ModeEnum.profile, Enum)
    assert isinstance(ModeEnum.action, Enum)
    assert len(list(ModeEnum)) == 2
