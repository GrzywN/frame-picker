"""Tests for password utilities"""

import pytest

from api.app.utils.password import hash_password, verify_password


class TestPasswordUtils:
    """Test password hashing and verification"""

    def test_hash_password(self):
        """Test password hashing"""
        password = "test_password_123"
        hashed = hash_password(password)

        assert hashed != password
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_hash_password_different_results(self):
        """Test that same password produces different hashes (due to salt)"""
        password = "same_password"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2

    def test_verify_password_correct(self):
        """Test password verification with correct password"""
        password = "correct_password"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password"""
        password = "correct_password"
        wrong_password = "wrong_password"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty(self):
        """Test password verification with empty password"""
        password = "test_password"
        hashed = hash_password(password)

        assert verify_password("", hashed) is False

    def test_hash_empty_password(self):
        """Test hashing empty password"""
        hashed = hash_password("")

        assert isinstance(hashed, str)
        assert len(hashed) > 0
        assert verify_password("", hashed) is True

    def test_unicode_password(self):
        """Test password with unicode characters"""
        password = "test_пароль_123_🔒"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True
        assert verify_password("different_password", hashed) is False
