"""
Tests for base models
"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from api.app.models.base import BaseResponse, ErrorResponse, HealthCheck


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


class TestErrorResponse:
    """Test ErrorResponse model"""

    def test_error_response_creation(self):
        """Test basic ErrorResponse creation"""
        response = ErrorResponse(message="Something went wrong", error="ValueError")

        assert response.message == "Something went wrong"
        assert response.error == "ValueError"
        assert response.session_id is None
        assert isinstance(response.timestamp, datetime)

    def test_error_response_with_session_id(self, sample_session_id):
        """Test ErrorResponse with session ID"""
        response = ErrorResponse(
            message="Processing failed",
            error="ProcessingError",
            session_id=sample_session_id,
        )

        assert response.message == "Processing failed"
        assert response.error == "ProcessingError"
        assert response.session_id == sample_session_id

    def test_error_response_validation_error(self):
        """Test ErrorResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            ErrorResponse(message="Test")

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("error",)
        assert errors[0]["type"] == "missing"


class TestHealthCheck:
    """Test HealthCheck model"""

    def test_health_check_creation(self):
        """Test basic HealthCheck creation"""
        health = HealthCheck(
            message="API is healthy", status="healthy", version="1.0.0"
        )

        assert health.message == "API is healthy"
        assert health.status == "healthy"
        assert health.version == "1.0.0"
        assert isinstance(health.timestamp, datetime)

    def test_health_check_validation_error(self):
        """Test HealthCheck validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            HealthCheck(message="Test")

        errors = exc_info.value.errors()
        assert len(errors) == 2
        error_fields = {error["loc"][0] for error in errors}
        assert error_fields == {"status", "version"}
