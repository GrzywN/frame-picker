"""Tests for usage service"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from api.app.database.models.processing_job import ProcessingJob
from api.app.database.models.session import Session
from api.app.database.models.user import User
from api.app.database.models.video_file import VideoFile
from api.app.services.usage_service import UsageService


class TestUsageService:
    """Test UsageService operations"""

    @pytest.fixture
    def usage_service(self, db_session):
        """Create usage service with test session"""
        return UsageService(db_session)

    @pytest.fixture
    def sample_user(self, db_session):
        """Create sample user for testing"""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            tier="FREE",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def sample_session(self, db_session, sample_user):
        """Create sample session for testing"""
        session = Session(
            session_id="test_session_123", user_id=sample_user.id, status="created"
        )
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)
        return session

    @pytest.fixture
    def sample_video_file(self, db_session, sample_session):
        """Create sample video file for testing"""
        video_file = VideoFile(
            session_id=sample_session.id,
            original_filename="test.mp4",
            safe_filename="test_safe.mp4",
            file_path="/tmp/test.mp4",
            file_size=1024000,
            content_type="video/mp4",
        )
        db_session.add(video_file)
        db_session.commit()
        db_session.refresh(video_file)
        return video_file

    def test_get_monthly_usage_no_jobs(self, usage_service, sample_user):
        """Test monthly usage with no completed jobs"""
        usage = usage_service.get_monthly_usage(str(sample_user.id))

        assert usage == 0

    def test_get_monthly_usage_with_completed_jobs(
        self, usage_service, db_session, sample_user, sample_session, sample_video_file
    ):
        """Test monthly usage with completed jobs this month"""
        # Create completed job from this month
        job = ProcessingJob(
            session_id=sample_session.id,
            video_file_id=sample_video_file.id,
            mode="profile",
            quality="balanced",
            count=1,
            sample_rate=30,
            min_interval=2.0,
            status="completed",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(job)
        db_session.commit()

        usage = usage_service.get_monthly_usage(str(sample_user.id))

        assert usage == 1

    def test_get_monthly_usage_ignores_other_statuses(
        self, usage_service, db_session, sample_user, sample_session, sample_video_file
    ):
        """Test that monthly usage only counts completed jobs"""
        # Create jobs with different statuses
        statuses = ["pending", "running", "failed"]
        for status in statuses:
            job = ProcessingJob(
                session_id=sample_session.id,
                video_file_id=sample_video_file.id,
                mode="profile",
                quality="balanced",
                count=1,
                sample_rate=30,
                min_interval=2.0,
                status=status,
                created_at=datetime.now(timezone.utc),
            )
            db_session.add(job)
        db_session.commit()

        usage = usage_service.get_monthly_usage(str(sample_user.id))

        assert usage == 0

    def test_get_monthly_usage_ignores_previous_month(
        self, usage_service, db_session, sample_user, sample_session, sample_video_file
    ):
        """Test that monthly usage ignores jobs from previous month"""
        # Create job from last month
        last_month = datetime.now(timezone.utc) - timedelta(days=35)
        job = ProcessingJob(
            session_id=sample_session.id,
            video_file_id=sample_video_file.id,
            mode="profile",
            quality="balanced",
            count=1,
            sample_rate=30,
            min_interval=2.0,
            status="completed",
            created_at=last_month,
        )
        db_session.add(job)
        db_session.commit()

        usage = usage_service.get_monthly_usage(str(sample_user.id))

        assert usage == 0

    def test_check_user_limits_free_tier_under_limit(self, usage_service, sample_user):
        """Test user limits check for free tier under limit"""
        result = usage_service.check_user_limits(sample_user)

        assert result["can_process"] is True
        assert result["current_usage"] == 0
        assert result["limit"] == 3
        assert result["remaining"] == 3

    def test_check_user_limits_free_tier_at_limit(
        self, usage_service, db_session, sample_user, sample_session, sample_video_file
    ):
        """Test user limits check for free tier at limit"""
        # Create 3 completed jobs (free tier limit)
        for _ in range(3):
            job = ProcessingJob(
                session_id=sample_session.id,
                video_file_id=sample_video_file.id,
                mode="profile",
                quality="balanced",
                count=1,
                sample_rate=30,
                min_interval=2.0,
                status="completed",
                created_at=datetime.now(timezone.utc),
            )
            db_session.add(job)
        db_session.commit()

        result = usage_service.check_user_limits(sample_user)

        assert result["can_process"] is False
        assert result["current_usage"] == 3
        assert result["limit"] == 3
        assert result["remaining"] == 0

    def test_get_anonymous_daily_usage_no_jobs(self, usage_service):
        """Test anonymous daily usage with no jobs"""
        usage = usage_service.get_anonymous_daily_usage("test_session_123")

        assert usage == 0

    def test_get_anonymous_daily_usage_with_jobs(self, usage_service, db_session):
        """Test anonymous daily usage with completed jobs today"""
        # Create anonymous session
        session = Session(
            session_id="anonymous_session", user_id=None, status="created"  # Anonymous
        )
        db_session.add(session)
        db_session.commit()

        # Create video file
        video_file = VideoFile(
            session_id=session.id,
            original_filename="test.mp4",
            safe_filename="test_safe.mp4",
            file_path="/tmp/test.mp4",
            file_size=1024000,
            content_type="video/mp4",
        )
        db_session.add(video_file)
        db_session.commit()

        # Create completed job
        job = ProcessingJob(
            session_id=session.id,
            video_file_id=video_file.id,
            mode="profile",
            quality="balanced",
            count=1,
            sample_rate=30,
            min_interval=2.0,
            status="completed",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(job)
        db_session.commit()

        usage = usage_service.get_anonymous_daily_usage("anonymous_session")

        assert usage == 1

    def test_check_anonymous_limits_under_limit(self, usage_service):
        """Test anonymous limits check under limit"""
        result = usage_service.check_anonymous_limits("test_session")

        assert result["can_process"] is True
        assert result["current_usage"] == 0
        assert result["limit"] == 1
        assert result["remaining"] == 1

    def test_get_usage_stats_user(self, usage_service, sample_user):
        """Test getting usage stats for user"""
        result = usage_service.get_usage_stats(user_id=str(sample_user.id))

        assert "can_process" in result
        assert "current_usage" in result
        assert "limit" in result
        assert "remaining" in result
        assert result["can_process"] is True
        assert result["current_usage"] == 0

    def test_get_usage_stats_anonymous(self, usage_service):
        """Test getting usage stats for anonymous session"""
        result = usage_service.get_usage_stats(session_id="test_session")

        assert "can_process" in result
        assert "current_usage" in result
        assert "limit" in result
        assert "remaining" in result
        assert result["can_process"] is True
        assert result["current_usage"] == 0

    def test_get_usage_stats_no_params(self, usage_service):
        """Test getting usage stats without parameters"""
        result = usage_service.get_usage_stats()

        assert "error" in result
        assert result["error"] == "Either user_id or session_id required"

    def test_get_usage_stats_nonexistent_user(self, usage_service):
        """Test getting usage stats for nonexistent user"""
        fake_user_id = str(uuid.uuid4())
        result = usage_service.get_usage_stats(user_id=fake_user_id)

        assert "error" in result
        assert result["error"] == "User not found"

    def test_check_user_limits_pro_tier(
        self, usage_service, db_session, sample_session, sample_video_file
    ):
        """Test user limits check for pro tier"""
        # Create PRO user
        pro_user = User(
            email="pro@example.com",
            password_hash="hashed_password",
            tier="PRO",
            is_active=True,
        )
        db_session.add(pro_user)
        db_session.commit()

        result = usage_service.check_user_limits(pro_user)

        assert result["can_process"] is True
        assert result["current_usage"] == 0
        assert result["limit"] == 100  # PRO tier limit
        assert result["remaining"] == 100

    def test_anonymous_daily_usage_ignores_yesterday(self, usage_service, db_session):
        """Test that anonymous daily usage ignores jobs from yesterday"""
        # Create anonymous session
        session = Session(session_id="test_session", user_id=None, status="created")
        db_session.add(session)
        db_session.commit()

        # Create video file
        video_file = VideoFile(
            session_id=session.id,
            original_filename="test.mp4",
            safe_filename="test_safe.mp4",
            file_path="/tmp/test.mp4",
            file_size=1024000,
            content_type="video/mp4",
        )
        db_session.add(video_file)
        db_session.commit()

        # Create job from yesterday
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        job = ProcessingJob(
            session_id=session.id,
            video_file_id=video_file.id,
            mode="profile",
            quality="balanced",
            count=1,
            sample_rate=30,
            min_interval=2.0,
            status="completed",
            created_at=yesterday,
        )
        db_session.add(job)
        db_session.commit()

        usage = usage_service.get_anonymous_daily_usage("test_session")

        assert usage == 0
