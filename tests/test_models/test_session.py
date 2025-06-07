"""
Tests for session models
"""

from datetime import datetime

import pytest
from pydantic import ValidationError

from api.app.models import (
    ProcessRequest,
    SessionCreate,
    SessionResponse,
    SessionStatus,
    VideoInfo,
)


class TestSessionCreate:
    """Test SessionCreate model"""

    def test_session_create_empty(self):
        """Test SessionCreate with no parameters"""
        session_create = SessionCreate()
        assert isinstance(session_create, SessionCreate)

    def test_session_create_serialization(self):
        """Test SessionCreate serialization"""
        session_create = SessionCreate()
        data = session_create.model_dump()
        assert data == {}


class TestSessionResponse:
    """Test SessionResponse model"""

    def test_session_response_creation(self, sample_session_id, sample_datetime):
        """Test basic SessionResponse creation"""
        response = SessionResponse(
            message="Session created",
            session_id=sample_session_id,
            status="created",
            created_at=sample_datetime,
        )

        assert response.message == "Session created"
        assert response.session_id == sample_session_id
        assert response.status == "created"
        assert response.created_at == sample_datetime
        assert response.expires_at is None

    def test_session_response_minimal(self, sample_session_id):
        """Test SessionResponse with minimal required fields"""
        response = SessionResponse(
            message="Test message", session_id=sample_session_id, status="created"
        )

        assert response.message == "Test message"
        assert response.session_id == sample_session_id
        assert response.status == "created"
        assert response.created_at is None
        assert response.expires_at is None

    def test_session_response_validation_error(self):
        """Test SessionResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            SessionResponse(message="Test")

        errors = exc_info.value.errors()
        assert len(errors) == 2
        error_fields = {error["loc"][0] for error in errors}
        assert error_fields == {"session_id", "status"}


class TestSessionStatus:
    """Test SessionStatus model"""

    def test_session_status_creation(self, sample_session_id):
        """Test basic SessionStatus creation"""
        status = SessionStatus(
            session_id=sample_session_id,
            status="processing",
            message="Processing video",
            progress=50,
        )

        assert status.session_id == sample_session_id
        assert status.status == "processing"
        assert status.message == "Processing video"
        assert status.progress == 50
        assert status.video_info is None
        assert status.processing_params is None
        assert status.results is None
        assert status.error is None

    def test_session_status_with_video_info(self, sample_session_id, sample_video_info):
        """Test SessionStatus with video info"""
        video_info = VideoInfo(**sample_video_info)

        status = SessionStatus(
            session_id=sample_session_id,
            status="uploaded",
            message="Video uploaded",
            video_info=video_info,
        )

        assert status.video_info == video_info
        assert status.video_info.filename == "test_video.mp4"
        assert status.video_info.size == 1024000

    def test_session_status_with_processing_params(self, sample_session_id):
        """Test SessionStatus with processing parameters"""
        process_request = ProcessRequest(mode="profile", quality="balanced", count=3)

        status = SessionStatus(
            session_id=sample_session_id,
            status="processing",
            message="Processing started",
            processing_params=process_request,
        )

        assert status.processing_params == process_request
        assert status.processing_params.mode == "profile"
        assert status.processing_params.count == 3

    def test_session_status_progress_validation(self, sample_session_id):
        """Test SessionStatus progress field validation"""
        # Valid progress values
        status = SessionStatus(
            session_id=sample_session_id,
            status="processing",
            message="Test",
            progress=0,
        )
        assert status.progress == 0

        status = SessionStatus(
            session_id=sample_session_id,
            status="processing",
            message="Test",
            progress=100,
        )
        assert status.progress == 100

        # Invalid progress values
        with pytest.raises(ValidationError):
            SessionStatus(
                session_id=sample_session_id,
                status="processing",
                message="Test",
                progress=-1,
            )

        with pytest.raises(ValidationError):
            SessionStatus(
                session_id=sample_session_id,
                status="processing",
                message="Test",
                progress=101,
            )

    def test_session_status_with_results(self, sample_session_id):
        """Test SessionStatus with results"""
        results = [
            {"frame_index": 0, "score": 0.9, "timestamp": 10.5},
            {"frame_index": 1, "score": 0.8, "timestamp": 20.0},
        ]

        status = SessionStatus(
            session_id=sample_session_id,
            status="completed",
            message="Processing completed",
            progress=100,
            results=results,
        )

        assert status.results == results
        assert len(status.results) == 2
        assert status.results[0]["frame_index"] == 0
        assert status.results[1]["score"] == 0.8

    def test_session_status_with_error(self, sample_session_id):
        """Test SessionStatus with error"""
        status = SessionStatus(
            session_id=sample_session_id,
            status="failed",
            message="Processing failed",
            error="Invalid video format",
        )

        assert status.error == "Invalid video format"
        assert status.status == "failed"
