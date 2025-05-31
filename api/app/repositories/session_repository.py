"""
Session repository
"""

from typing import Optional

from sqlalchemy.orm import Session as DBSession

from ..database.models import Session
from .base import BaseRepository


class SessionRepository(BaseRepository[Session]):
    """Repository for session operations"""

    def __init__(self, db: DBSession):
        super().__init__(Session, db)

    def get_by_session_id(self, session_id: str) -> Optional[Session]:
        """Get session by session_id"""
        return self.db.query(Session).filter(Session.session_id == session_id).first()

    def create_session(self, session_id: str, expires_at=None) -> Session:
        """Create new session"""
        return self.create(
            session_id=session_id,
            status="created",
            message="Session created",
            expires_at=expires_at,
        )

    def update_session_status(
        self,
        session: Session,
        status: str,
        message: str = None,
        progress: int = None,
        error: str = None,
    ) -> Session:
        """Update session status and related fields"""
        update_data = {"status": status}

        if message is not None:
            update_data["message"] = message
        if progress is not None:
            update_data["progress"] = progress
        if error is not None:
            update_data["error"] = error

        return self.update(session, **update_data)
