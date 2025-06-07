"""
Tests for QualityEnum
"""

from enum import Enum

from api.app.enums.quality import QualityEnum


def test_quality_enum_values():
    """Test QualityEnum values"""
    assert QualityEnum.fast.value == "fast"
    assert QualityEnum.balanced.value == "balanced"
    assert QualityEnum.best.value == "best"


def test_quality_enum_str():
    """Test QualityEnum string representation"""
    assert str(QualityEnum.fast) == "fast"
    assert str(QualityEnum.balanced) == "balanced"
    assert str(QualityEnum.best) == "best"


def test_quality_enum_members():
    """Test QualityEnum members"""
    assert isinstance(QualityEnum.fast, Enum)
    assert isinstance(QualityEnum.balanced, Enum)
    assert isinstance(QualityEnum.best, Enum)
    assert len(list(QualityEnum)) == 3
