"""Tests for BaseResponse model"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from api.app.models.base import BaseResponse


class TestBaseResponse:
    """Test BaseResponse model"""

    def test_base_response_creation(self):
        """Test basic BaseResponse creation"""
        response = BaseResponse(message="Test message")

        assert response.message == "Test message"
        assert isinstance(response.timestamp, datetime)

    def test_base_response_with_custom_timestamp(self, sample_datetime):
        """Test BaseResponse with custom timestamp"""
        response = BaseResponse(message="Test message", timestamp=sample_datetime)

        assert response.message == "Test message"
        assert response.timestamp == sample_datetime

    def test_base_response_validation_error(self):
        """Test BaseResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            BaseResponse()

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("message",)
        assert errors[0]["type"] == "missing"
