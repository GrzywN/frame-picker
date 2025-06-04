"""Test configuration and fixtures"""

from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer

from api.app.database.connection import Base


@pytest.fixture(scope="session")
def postgres_container():
    """Create PostgreSQL test container for session"""
    with PostgresContainer("postgres:17.5-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="function")
def db_session(postgres_container):
    """Create test database session with PostgreSQL container"""
    db_url = postgres_container.get_connection_url()

    engine = create_engine(db_url)

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def sample_datetime():
    """Sample datetime for testing"""
    return datetime(2025, 1, 15, 12, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def sample_session_id():
    """Sample session ID"""
    return "test-session-123"


@pytest.fixture
def sample_video_info():
    """Sample video info data"""
    return {
        "filename": "test_video.mp4",
        "size": 1024000,
        "duration": 30.5,
        "fps": 25.0,
        "width": 1920,
        "height": 1080,
        "format": ".mp4",
    }
