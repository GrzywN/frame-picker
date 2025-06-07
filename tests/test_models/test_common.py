"""
Tests for common enums
"""

import pytest

from api.app.models import ModeEnum, QualityEnum, StatusEnum


class TestModeEnum:
    """Test ModeEnum"""

    def test_mode_enum_values(self):
        """Test ModeEnum has correct values"""
        assert ModeEnum.profile == "profile"
        assert ModeEnum.action == "action"

    def test_mode_enum_list(self):
        """Test ModeEnum contains all expected values"""
        expected_values = {"profile", "action"}
        actual_values = {mode.value for mode in ModeEnum}
        assert actual_values == expected_values

    def test_mode_enum_from_string(self):
        """Test creating ModeEnum from string"""
        assert ModeEnum("profile") == ModeEnum.profile
        assert ModeEnum("action") == ModeEnum.action

    def test_mode_enum_invalid_value(self):
        """Test ModeEnum with invalid value"""
        with pytest.raises(ValueError):
            ModeEnum("invalid")


class TestQualityEnum:
    """Test QualityEnum"""

    def test_quality_enum_values(self):
        """Test QualityEnum has correct values"""
        assert QualityEnum.fast == "fast"
        assert QualityEnum.balanced == "balanced"
        assert QualityEnum.best == "best"

    def test_quality_enum_list(self):
        """Test QualityEnum contains all expected values"""
        expected_values = {"fast", "balanced", "best"}
        actual_values = {quality.value for quality in QualityEnum}
        assert actual_values == expected_values

    def test_quality_enum_from_string(self):
        """Test creating QualityEnum from string"""
        assert QualityEnum("fast") == QualityEnum.fast
        assert QualityEnum("balanced") == QualityEnum.balanced
        assert QualityEnum("best") == QualityEnum.best

    def test_quality_enum_invalid_value(self):
        """Test QualityEnum with invalid value"""
        with pytest.raises(ValueError):
            QualityEnum("invalid")


class TestStatusEnum:
    """Test StatusEnum"""

    def test_status_enum_values(self):
        """Test StatusEnum has correct values"""
        assert StatusEnum.created == "created"
        assert StatusEnum.uploaded == "uploaded"
        assert StatusEnum.processing == "processing"
        assert StatusEnum.completed == "completed"
        assert StatusEnum.failed == "failed"

    def test_status_enum_list(self):
        """Test StatusEnum contains all expected values"""
        expected_values = {"created", "uploaded", "processing", "completed", "failed"}
        actual_values = {status.value for status in StatusEnum}
        assert actual_values == expected_values

    def test_status_enum_from_string(self):
        """Test creating StatusEnum from string"""
        assert StatusEnum("created") == StatusEnum.created
        assert StatusEnum("processing") == StatusEnum.processing
        assert StatusEnum("completed") == StatusEnum.completed

    def test_status_enum_invalid_value(self):
        """Test StatusEnum with invalid value"""
        with pytest.raises(ValueError):
            StatusEnum("invalid")
