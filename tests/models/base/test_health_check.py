"""Tests for HealthCheck model"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from api.app.models.base import HealthCheck


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
