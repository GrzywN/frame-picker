"""Tests for SuccessResponse model"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from api.app.models.base import SuccessResponse


class TestSuccessResponse:
    """Test SuccessResponse model"""

    def test_success_response_creation(self):
        """Test basic SuccessResponse creation"""
        response = SuccessResponse(message="Operation completed")

        assert response.message == "Operation completed"
        assert response.success is True
        assert isinstance(response.timestamp, datetime)

    def test_success_response_with_success_false(self):
        """Test SuccessResponse with success=False"""
        response = SuccessResponse(
            message="Operation completed with warnings", success=False
        )

        assert response.success is False

    def test_success_response_validation_error(self):
        """Test SuccessResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            SuccessResponse()

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("message",)
        assert errors[0]["type"] == "missing"
