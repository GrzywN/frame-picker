"""Session management service using PostgreSQL"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session as DBSession

from ..config import settings
from ..database.models import Session
from ..repositories.session_repository import SessionRepository


class SessionService:
    """Manages user sessions using PostgreSQL"""

    def __init__(self, db: DBSession):
        self.db = db
        self.session_repo = SessionRepository(db)

    def _now_utc(self) -> datetime:
        """Get current UTC datetime with timezone info"""
        return datetime.now(timezone.utc)

    def _to_utc(self, dt: datetime) -> datetime:
        """Convert datetime to UTC with timezone info"""
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    async def create_session(
        self, session_id: str, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new session with optional user association"""
        now = self._now_utc()
        expires_at = now + timedelta(hours=settings.SESSION_EXPIRE_HOURS)

        session = self.session_repo.create_session(session_id, expires_at)

        # Associate with user if provided
        if user_id:
            session = self.session_repo.update(session, user_id=user_id)

        return {
            "session_id": session.session_id,
            "status": session.status,
            "message": session.message,
            "user_id": str(session.user_id) if session.user_id else None,
            "created_at": self._to_utc(session.created_at).isoformat(),
            "expires_at": (
                self._to_utc(session.expires_at).isoformat()
                if session.expires_at
                else None
            ),
        }

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        session = self.session_repo.get_by_session_id(session_id)

        if not session:
            return None

        # Check if session expired
        if session.expires_at:
            session_expires_at = self._to_utc(session.expires_at)
            if session_expires_at < self._now_utc():
                return None

        return {
            "session_id": session.session_id,
            "status": session.status,
            "message": session.message,
            "progress": session.progress,
            "error": session.error,
            "user_id": str(session.user_id) if session.user_id else None,
            "created_at": self._to_utc(session.created_at).isoformat(),
            "expires_at": (
                self._to_utc(session.expires_at).isoformat()
                if session.expires_at
                else None
            ),
        }

    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session with new data"""
        session = self.session_repo.get_by_session_id(session_id)

        if not session:
            return False

        # Add updated_at timestamp
        updates["updated_at"] = self._now_utc()

        self.session_repo.update(session, **updates)
        return True

    async def cleanup_session(self, session_id: str) -> bool:
        """Clean up session and associated data"""
        session = self.session_repo.get_by_session_id(session_id)

        if not session:
            return False

        # Cleanup will cascade to related records (video files, processing jobs, frame results)
        self.session_repo.delete(session)
        return True

    async def associate_user_with_session(self, session_id: str, user_id: str) -> bool:
        """Associate existing session with a user"""
        session = self.session_repo.get_by_session_id(session_id)
        if not session:
            return False

        self.session_repo.update(session, user_id=user_id)
        return True
