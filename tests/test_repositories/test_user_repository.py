"""Tests for user repository"""

import pytest

from api.app.repositories.user_repository import UserRepository


class TestUserRepository:
    """Test UserRepository operations"""

    def test_create_user(self, db_session):
        """Test user creation"""
        user_repo = UserRepository(db_session)
        email = "test@example.com"
        password_hash = "hashed_password_123"
        tier = "FREE"

        user = user_repo.create_user(email, password_hash, tier)

        assert user.id is not None
        assert user.email == email
        assert user.password_hash == password_hash
        assert user.tier == tier
        assert user.is_active is True

    def test_get_by_email_exists(self, db_session):
        """Test getting user by email when user exists"""
        user_repo = UserRepository(db_session)
        email = "test@example.com"
        password_hash = "hashed_password_123"

        created_user = user_repo.create_user(email, password_hash)
        found_user = user_repo.get_by_email(email)

        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == email

    def test_get_by_email_not_exists(self, db_session):
        """Test getting user by email when user doesn't exist"""
        user_repo = UserRepository(db_session)
        found_user = user_repo.get_by_email("nonexistent@example.com")

        assert found_user is None

    def test_update_user_tier(self, db_session):
        """Test updating user tier"""
        user_repo = UserRepository(db_session)
        email = "test@example.com"
        password_hash = "hashed_password_123"

        user = user_repo.create_user(email, password_hash, "FREE")
        updated_user = user_repo.update_user_tier(user, "PRO")

        assert updated_user.tier == "PRO"
        assert updated_user.id == user.id
