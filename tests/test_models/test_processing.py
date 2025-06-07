"""
Tests for processing models
"""

import pytest
from pydantic import ValidationError

from api.app.models import (
    FrameResult,
    ModeEnum,
    ProcessRequest,
    ProcessResponse,
    QualityEnum,
)


class TestProcessRequest:
    """Test ProcessRequest model"""

    def test_process_request_defaults(self):
        """Test ProcessRequest with default values"""
        request = ProcessRequest()

        assert request.mode == ModeEnum.profile
        assert request.quality == QualityEnum.balanced
        assert request.count == 1
        assert request.sample_rate == 30
        assert request.min_interval == 2.0

    def test_process_request_custom_values(self):
        """Test ProcessRequest with custom values"""
        request = ProcessRequest(
            mode="action", quality="best", count=5, sample_rate=15, min_interval=3.5
        )

        assert request.mode == ModeEnum.action
        assert request.quality == QualityEnum.best
        assert request.count == 5
        assert request.sample_rate == 15
        assert request.min_interval == 3.5

    def test_process_request_count_validation(self):
        """Test ProcessRequest count field validation"""
        # Valid count values
        request = ProcessRequest(count=1)
        assert request.count == 1

        request = ProcessRequest(count=10)
        assert request.count == 10

        # Invalid count values
        with pytest.raises(ValidationError):
            ProcessRequest(count=0)

        with pytest.raises(ValidationError):
            ProcessRequest(count=11)

    def test_process_request_sample_rate_validation(self):
        """Test ProcessRequest sample_rate field validation"""
        # Valid sample_rate values
        request = ProcessRequest(sample_rate=1)
        assert request.sample_rate == 1

        request = ProcessRequest(sample_rate=60)
        assert request.sample_rate == 60

        # Invalid sample_rate values
        with pytest.raises(ValidationError):
            ProcessRequest(sample_rate=0)

        with pytest.raises(ValidationError):
            ProcessRequest(sample_rate=61)

    def test_process_request_min_interval_validation(self):
        """Test ProcessRequest min_interval field validation"""
        # Valid min_interval values
        request = ProcessRequest(min_interval=0.5)
        assert request.min_interval == 0.5

        request = ProcessRequest(min_interval=10.0)
        assert request.min_interval == 10.0

        # Invalid min_interval values
        with pytest.raises(ValidationError):
            ProcessRequest(min_interval=0.4)

        with pytest.raises(ValidationError):
            ProcessRequest(min_interval=10.1)

    def test_process_request_invalid_mode(self):
        """Test ProcessRequest with invalid mode"""
        with pytest.raises(ValidationError):
            ProcessRequest(mode="invalid")

    def test_process_request_invalid_quality(self):
        """Test ProcessRequest with invalid quality"""
        with pytest.raises(ValidationError):
            ProcessRequest(quality="invalid")


class TestProcessResponse:
    """Test ProcessResponse model"""

    def test_process_response_creation(self, sample_session_id):
        """Test basic ProcessResponse creation"""
        response = ProcessResponse(
            session_id=sample_session_id,
            status="processing",
            message="Processing started",
        )

        assert response.session_id == sample_session_id
        assert response.status == "processing"
        assert response.message == "Processing started"
        assert response.estimated_time is None

    def test_process_response_with_estimated_time(self, sample_session_id):
        """Test ProcessResponse with estimated time"""
        response = ProcessResponse(
            session_id=sample_session_id,
            status="processing",
            message="Processing started",
            estimated_time=120,
        )

        assert response.estimated_time == 120

    def test_process_response_validation_error(self):
        """Test ProcessResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            ProcessResponse(session_id="test")

        errors = exc_info.value.errors()
        assert len(errors) == 2
        error_fields = {error["loc"][0] for error in errors}
        assert error_fields == {"status", "message"}


class TestFrameResult:
    """Test FrameResult model"""

    def test_frame_result_creation(self):
        """Test basic FrameResult creation"""
        result = FrameResult(frame_index=0, score=0.85, timestamp=15.5)

        assert result.frame_index == 0
        assert result.score == 0.85
        assert result.timestamp == 15.5
        assert result.file_path is None
        assert result.download_url is None
        assert result.width is None
        assert result.height is None
        assert result.file_size is None

    def test_frame_result_full_data(self):
        """Test FrameResult with all fields"""
        result = FrameResult(
            frame_index=2,
            score=0.92,
            timestamp=30.75,
            file_path="/path/to/frame.jpg",
            download_url="/api/download/frame.jpg",
            width=1920,
            height=1080,
            file_size=245760,
        )

        assert result.frame_index == 2
        assert result.score == 0.92
        assert result.timestamp == 30.75
        assert result.file_path == "/path/to/frame.jpg"
        assert result.download_url == "/api/download/frame.jpg"
        assert result.width == 1920
        assert result.height == 1080
        assert result.file_size == 245760

    def test_frame_result_score_validation(self):
        """Test FrameResult score field validation"""
        # Valid score values
        result = FrameResult(frame_index=0, score=0.0, timestamp=0.0)
        assert result.score == 0.0

        result = FrameResult(frame_index=0, score=1.0, timestamp=0.0)
        assert result.score == 1.0

        result = FrameResult(frame_index=0, score=0.5, timestamp=0.0)
        assert result.score == 0.5

        # Invalid score values
        with pytest.raises(ValidationError):
            FrameResult(frame_index=0, score=-0.1, timestamp=0.0)

        with pytest.raises(ValidationError):
            FrameResult(frame_index=0, score=1.1, timestamp=0.0)

    def test_frame_result_timestamp_validation(self):
        """Test FrameResult timestamp field validation"""
        # Valid timestamp values
        result = FrameResult(frame_index=0, score=0.5, timestamp=0.0)
        assert result.timestamp == 0.0

        result = FrameResult(frame_index=0, score=0.5, timestamp=100.5)
        assert result.timestamp == 100.5

        # Invalid timestamp values
        with pytest.raises(ValidationError):
            FrameResult(frame_index=0, score=0.5, timestamp=-1.0)

    def test_frame_result_validation_error(self):
        """Test FrameResult validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            FrameResult(frame_index=0)

        errors = exc_info.value.errors()
        assert len(errors) == 2
        error_fields = {error["loc"][0] for error in errors}
        assert error_fields == {"score", "timestamp"}

    def test_frame_result_serialization(self):
        """Test FrameResult serialization"""
        result = FrameResult(
            frame_index=1, score=0.75, timestamp=25.0, width=1280, height=720
        )

        data = result.model_dump()
        expected_data = {
            "frame_index": 1,
            "score": 0.75,
            "timestamp": 25.0,
            "file_path": None,
            "download_url": None,
            "width": 1280,
            "height": 720,
            "file_size": None,
        }

        assert data == expected_data
