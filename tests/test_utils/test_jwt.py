"""Tests for JWT utilities"""

from datetime import datetime, timedelta, timezone

import pytest

from api.app.utils.jwt import create_access_token, get_user_id_from_token, verify_token


class TestJWTUtils:
    """Test JWT token creation and verification"""

    def test_create_access_token(self):
        """Test JWT token creation"""
        data = {"sub": "user_123", "email": "test@example.com"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_token_valid(self):
        """Test verification of valid token"""
        data = {"sub": "user_123", "role": "admin"}
        token = create_access_token(data)

        payload = verify_token(token)

        assert payload is not None
        assert payload["sub"] == "user_123"
        assert payload["role"] == "admin"
        assert "exp" in payload

    def test_verify_token_invalid(self):
        """Test verification of invalid token"""
        invalid_token = "invalid.token.here"

        payload = verify_token(invalid_token)

        assert payload is None

    def test_verify_token_malformed(self):
        """Test verification of malformed token"""
        malformed_token = "not.a.jwt"

        payload = verify_token(malformed_token)

        assert payload is None

    def test_create_token_with_custom_expiry(self):
        """Test token creation with custom expiry"""
        data = {"sub": "user_123"}
        expires_delta = timedelta(minutes=5)

        token = create_access_token(data, expires_delta)
        payload = verify_token(token)

        assert payload is not None
        assert payload["sub"] == "user_123"

        # Check expiry is approximately 5 minutes from now
        exp_timestamp = payload["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        expected_exp = datetime.now(timezone.utc) + expires_delta

        # Allow 5 second tolerance
        assert abs((exp_datetime - expected_exp).total_seconds()) < 5

    def test_get_user_id_from_token_valid(self):
        """Test extracting user ID from valid token"""
        user_id = "user_456"
        data = {"sub": user_id, "email": "test@example.com"}
        token = create_access_token(data)

        extracted_id = get_user_id_from_token(token)

        assert extracted_id == user_id

    def test_get_user_id_from_token_invalid(self):
        """Test extracting user ID from invalid token"""
        invalid_token = "invalid.token.here"

        extracted_id = get_user_id_from_token(invalid_token)

        assert extracted_id is None

    def test_get_user_id_from_token_no_sub(self):
        """Test extracting user ID from token without sub claim"""
        data = {"email": "test@example.com", "role": "user"}
        token = create_access_token(data)

        extracted_id = get_user_id_from_token(token)

        assert extracted_id is None

    def test_token_contains_expiry(self):
        """Test that token contains expiry timestamp"""
        data = {"sub": "user_123"}
        token = create_access_token(data)
        payload = verify_token(token)

        assert "exp" in payload
        assert isinstance(payload["exp"], int)
        assert payload["exp"] > datetime.now(timezone.utc).timestamp()
