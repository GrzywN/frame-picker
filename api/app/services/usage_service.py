"""Usage tracking and limit checking service"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import and_, func
from sqlalchemy.orm import Session as DBSession

from ..config import settings
from ..database.models.processing_job import ProcessingJob
from ..database.models.session import Session
from ..database.models.user import User


class UsageService:
    """Service for tracking and checking usage limits"""

    def __init__(self, db: DBSession):
        self.db = db

    def get_monthly_usage(self, user_id: str) -> int:
        """Get number of completed processing jobs this month for user"""
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        count = (
            self.db.query(func.count(ProcessingJob.id))
            .join(Session, ProcessingJob.session_id == Session.id)
            .filter(
                and_(
                    Session.user_id == user_id,
                    ProcessingJob.status == "completed",
                    ProcessingJob.created_at >= month_start,
                )
            )
            .scalar()
        )

        return count or 0

    def get_anonymous_daily_usage(self, session_id: str) -> int:
        """Get number of completed jobs for anonymous session today"""
        now = datetime.now(timezone.utc)
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        count = (
            self.db.query(func.count(ProcessingJob.id))
            .join(Session, ProcessingJob.session_id == Session.id)
            .filter(
                and_(
                    Session.session_id == session_id,
                    Session.user_id.is_(None),
                    ProcessingJob.status == "completed",
                    ProcessingJob.created_at >= day_start,
                )
            )
            .scalar()
        )

        return count or 0

    def check_user_limits(self, user: User) -> dict:
        """Check if user can process more videos"""
        limits = settings.get_tier_limits(user.tier)
        current_usage = self.get_monthly_usage(user.id)

        return {
            "can_process": current_usage < limits["videos_per_month"],
            "current_usage": current_usage,
            "limit": limits["videos_per_month"],
            "remaining": max(0, limits["videos_per_month"] - current_usage),
        }

    def check_anonymous_limits(self, session_id: str) -> dict:
        """Check if anonymous session can process more videos"""
        current_usage = self.get_anonymous_daily_usage(session_id)
        daily_limit = 1  # Anonymous users: 1 video per day

        return {
            "can_process": current_usage < daily_limit,
            "current_usage": current_usage,
            "limit": daily_limit,
            "remaining": max(0, daily_limit - current_usage),
        }

    def get_usage_stats(
        self, user_id: Optional[str] = None, session_id: Optional[str] = None
    ) -> dict:
        """Get usage statistics"""
        if user_id:
            # Authenticated user stats
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"error": "User not found"}

            return self.check_user_limits(user)
        elif session_id:
            # Anonymous session stats
            return self.check_anonymous_limits(session_id)
        else:
            return {"error": "Either user_id or session_id required"}
