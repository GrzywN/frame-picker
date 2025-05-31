"""
Tests for video models
"""

import pytest
from pydantic import ValidationError

from api.app.models.video import VideoInfo, VideoUploadResponse


class TestVideoInfo:
    """Test VideoInfo model"""

    def test_video_info_creation(self, sample_video_info):
        """Test basic VideoInfo creation"""
        video_info = VideoInfo(**sample_video_info)

        assert video_info.filename == "test_video.mp4"
        assert video_info.size == 1024000
        assert video_info.duration == 30.5
        assert video_info.fps == 25.0
        assert video_info.width == 1920
        assert video_info.height == 1080
        assert video_info.format == ".mp4"

    def test_video_info_minimal(self):
        """Test VideoInfo with minimal required fields"""
        video_info = VideoInfo(filename="minimal.mp4", size=512000)

        assert video_info.filename == "minimal.mp4"
        assert video_info.size == 512000
        assert video_info.duration is None
        assert video_info.fps is None
        assert video_info.width is None
        assert video_info.height is None
        assert video_info.format is None

    def test_video_info_validation_error(self):
        """Test VideoInfo validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            VideoInfo(filename="test.mp4")

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("size",)
        assert errors[0]["type"] == "missing"

    def test_video_info_negative_size(self):
        """Test VideoInfo with negative size"""
        video_info = VideoInfo(filename="test.mp4", size=-100)
        assert video_info.size == -100  # No validation constraint on size

    def test_video_info_zero_duration(self):
        """Test VideoInfo with zero duration"""
        video_info = VideoInfo(filename="test.mp4", size=1000, duration=0.0)
        assert video_info.duration == 0.0

    def test_video_info_serialization(self, sample_video_info):
        """Test VideoInfo serialization"""
        video_info = VideoInfo(**sample_video_info)
        data = video_info.model_dump()

        expected_data = {
            "filename": "test_video.mp4",
            "size": 1024000,
            "duration": 30.5,
            "fps": 25.0,
            "width": 1920,
            "height": 1080,
            "format": ".mp4",
        }

        assert data == expected_data


class TestVideoUploadResponse:
    """Test VideoUploadResponse model"""

    def test_video_upload_response_creation(self, sample_session_id):
        """Test basic VideoUploadResponse creation"""
        file_info = {
            "filename": "test.mp4",
            "size": 1024000,
            "content_type": "video/mp4",
        }

        response = VideoUploadResponse(
            message="Video uploaded successfully",
            session_id=sample_session_id,
            file_info=file_info,
        )

        assert response.message == "Video uploaded successfully"
        assert response.session_id == sample_session_id
        assert response.file_info == file_info
        assert response.file_info["filename"] == "test.mp4"
        assert response.file_info["size"] == 1024000

    def test_video_upload_response_empty_file_info(self, sample_session_id):
        """Test VideoUploadResponse with empty file info"""
        response = VideoUploadResponse(
            message="Upload completed", session_id=sample_session_id, file_info={}
        )

        assert response.message == "Upload completed"
        assert response.session_id == sample_session_id
        assert response.file_info == {}

    def test_video_upload_response_validation_error(self):
        """Test VideoUploadResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            VideoUploadResponse(message="Test")

        errors = exc_info.value.errors()
        assert len(errors) == 2
        error_fields = {error["loc"][0] for error in errors}
        assert error_fields == {"session_id", "file_info"}

    def test_video_upload_response_serialization(self, sample_session_id):
        """Test VideoUploadResponse serialization"""
        file_info = {"filename": "test.mp4", "size": 1000}

        response = VideoUploadResponse(
            message="Success", session_id=sample_session_id, file_info=file_info
        )

        data = response.model_dump()
        expected_data = {
            "message": "Success",
            "session_id": sample_session_id,
            "file_info": {"filename": "test.mp4", "size": 1000},
        }

        assert data == expected_data
