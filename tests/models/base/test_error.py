"""Tests for ErrorResponse model"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from api.app.models.base import ErrorResponse


class TestErrorResponse:
    """Test ErrorResponse model"""

    def test_error_response_creation(self):
        """Test basic ErrorResponse creation"""
        response = ErrorResponse(message="Something went wrong", error="ValueError")

        assert response.message == "Something went wrong"
        assert response.error == "ValueError"
        assert response.details is None
        assert response.session_id is None
        assert isinstance(response.timestamp, datetime)

    def test_error_response_with_details(self):
        """Test ErrorResponse with details"""
        details = {"field": "email", "issue": "invalid format"}
        response = ErrorResponse(
            message="Validation failed", error="ValidationError", details=details
        )

        assert response.details == details

    def test_error_response_with_session_id(self, sample_session_id):
        """Test ErrorResponse with session ID"""
        response = ErrorResponse(
            message="Processing failed",
            error="ProcessingError",
            session_id=sample_session_id,
        )

        assert response.session_id == sample_session_id

    def test_error_response_validation_error(self):
        """Test ErrorResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            ErrorResponse(message="Test")

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("error",)
        assert errors[0]["type"] == "missing"
