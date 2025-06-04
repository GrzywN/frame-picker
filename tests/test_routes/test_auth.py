"""Tests for auth routes"""

import pytest
from fastapi.testclient import TestClient

from api.app.database.connection import get_db
from api.app.database.models.user import User
from api.app.main import app
from api.app.utils.password import hash_password


def override_get_db(db_session):
    """Override get_db dependency for testing"""

    def _override():
        yield db_session

    return _override


class TestAuthRoutes:
    """Test authentication routes"""

    @pytest.fixture
    def client_with_db(self, db_session):
        """Create test client with overridden database"""
        app.dependency_overrides[get_db] = override_get_db(db_session)
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    def test_register_success(self, client_with_db):
        """Test successful user registration"""
        user_data = {"email": "test@example.com", "password": "testpassword123"}

        response = client_with_db.post("/api/auth/register", json=user_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == user_data["email"]
        assert data["user"]["tier"] == "FREE"
        assert data["user"]["is_active"] is True

    def test_register_duplicate_email(self, client_with_db):
        """Test registration with duplicate email"""
        # First registration
        user_data = {"email": "test@example.com", "password": "testpassword123"}
        client_with_db.post("/api/auth/register", json=user_data)

        # Duplicate registration
        response = client_with_db.post("/api/auth/register", json=user_data)

        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_register_invalid_email(self, client_with_db):
        """Test registration with invalid email"""
        user_data = {"email": "invalid-email", "password": "testpassword123"}

        response = client_with_db.post("/api/auth/register", json=user_data)

        assert response.status_code == 422

    def test_register_short_password(self, client_with_db):
        """Test registration with short password"""
        user_data = {"email": "test@example.com", "password": "short"}

        response = client_with_db.post("/api/auth/register", json=user_data)

        assert response.status_code == 422

    def test_login_success(self, client_with_db, db_session):
        """Test successful login"""
        # Create user
        password = "testpassword123"
        user = User(
            email="test@example.com",
            password_hash=hash_password(password),
            tier="FREE",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        # Login
        login_data = {"email": "test@example.com", "password": password}

        response = client_with_db.post("/api/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@example.com"

    def test_login_wrong_password(self, client_with_db, db_session):
        """Test login with wrong password"""
        # Create user
        user = User(
            email="test@example.com",
            password_hash=hash_password("correctpassword"),
            tier="FREE",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        # Login with wrong password
        login_data = {"email": "test@example.com", "password": "wrongpassword"}

        response = client_with_db.post("/api/auth/login", json=login_data)

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client_with_db):
        """Test login with nonexistent user"""
        login_data = {"email": "nonexistent@example.com", "password": "testpassword123"}

        response = client_with_db.post("/api/auth/login", json=login_data)

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_get_current_user_unauthorized(self, client_with_db):
        """Test getting current user without token"""
        response = client_with_db.get("/api/auth/me")

        assert response.status_code == 401

    def test_get_current_user_success(self, client_with_db):
        """Test getting current user with valid token"""
        # Register user and get token
        user_data = {"email": "test@example.com", "password": "testpassword123"}

        register_response = client_with_db.post("/api/auth/register", json=user_data)
        assert register_response.status_code == 200

        register_data = register_response.json()
        assert "access_token" in register_data

        token = register_data["access_token"]

        # Get current user
        headers = {"Authorization": f"Bearer {token}"}
        response = client_with_db.get("/api/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["tier"] == "FREE"

    def test_get_usage_stats_authenticated(self, client_with_db):
        """Test getting usage stats for authenticated user"""
        # Register user and get token
        user_data = {"email": "test@example.com", "password": "testpassword123"}

        register_response = client_with_db.post("/api/auth/register", json=user_data)
        token = register_response.json()["access_token"]

        # Get usage stats
        headers = {"Authorization": f"Bearer {token}"}
        response = client_with_db.get("/api/auth/usage", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "can_process" in data
        assert "current_usage" in data
        assert "limit" in data
        assert "remaining" in data
        assert data["can_process"] is True
        assert data["current_usage"] == 0
        assert data["limit"] == 3  # FREE tier
