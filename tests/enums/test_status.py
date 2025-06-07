"""
Tests for StatusEnum
"""

from enum import Enum

from api.app.enums.status import StatusEnum


def test_status_enum_values():
    """Test StatusEnum values"""
    assert StatusEnum.created.value == "created"
    assert StatusEnum.uploaded.value == "uploaded"
    assert StatusEnum.processing.value == "processing"
    assert StatusEnum.completed.value == "completed"
    assert StatusEnum.failed.value == "failed"


def test_status_enum_str():
    """Test StatusEnum string representation"""
    assert str(StatusEnum.created) == "created"
    assert str(StatusEnum.uploaded) == "uploaded"
    assert str(StatusEnum.processing) == "processing"
    assert str(StatusEnum.completed) == "completed"
    assert str(StatusEnum.failed) == "failed"


def test_status_enum_members():
    """Test StatusEnum members"""
    assert isinstance(StatusEnum.created, Enum)
    assert isinstance(StatusEnum.uploaded, Enum)
    assert isinstance(StatusEnum.processing, Enum)
    assert isinstance(StatusEnum.completed, Enum)
    assert isinstance(StatusEnum.failed, Enum)
    assert len(list(StatusEnum)) == 5
