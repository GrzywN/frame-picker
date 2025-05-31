"""
Test configuration and fixtures
"""

from datetime import datetime, timedelta

import pytest


@pytest.fixture
def sample_datetime():
    """Sample datetime for testing"""
    return datetime(2025, 1, 15, 12, 0, 0)


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
