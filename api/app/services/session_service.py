"""
Session management service using Redis for storage
"""

import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import redis

from ..config import settings


class SessionService:
    """Manages user sessions and temporary data storage"""

    def __init__(self):
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL, decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
        except Exception:
            # Fallback to in-memory storage if Redis is not available
            self.redis_client = None
            self._memory_storage = {}
            print("Warning: Redis not available, using in-memory storage")

    async def create_session(self, session_id: str) -> Dict[str, Any]:
        """Create a new session"""
        now = datetime.now()
        expires_at = now + timedelta(hours=settings.SESSION_EXPIRE_HOURS)

        session_data = {
            "session_id": session_id,
            "status": "created",
            "message": "Session created",
            "created_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "file_info": None,
            "processing_params": None,
            "results": None,
            "progress": 0,
        }

        await self._set_session(session_id, session_data)
        return session_data

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        return await self._get_session(session_id)

    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session with new data"""
        session = await self._get_session(session_id)
        if not session:
            return False

        # Update with new data
        session.update(updates)
        session["updated_at"] = datetime.now().isoformat()

        await self._set_session(session_id, session)
        return True

    async def cleanup_session(self, session_id: str) -> bool:
        """Clean up session and associated files"""
        session = await self._get_session(session_id)
        if not session:
            return False

        # Clean up uploaded files
        if session.get("file_info"):
            file_path = session["file_info"].get("file_path")
            if file_path:
                try:
                    import os

                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    print(f"Error cleaning up file {file_path}: {e}")

        # Clean up result files
        if session.get("results"):
            for result in session["results"]:
                file_path = result.get("file_path")
                if file_path:
                    try:
                        import os

                        if os.path.exists(file_path):
                            os.remove(file_path)
                    except Exception as e:
                        print(f"Error cleaning up result file {file_path}: {e}")

        # Remove session from storage
        await self._delete_session(session_id)
        return True

    async def _set_session(self, session_id: str, data: Dict[str, Any]):
        """Store session data"""
        if self.redis_client:
            try:
                # Store in Redis with expiration
                self.redis_client.setex(
                    f"session:{session_id}",
                    timedelta(hours=settings.SESSION_EXPIRE_HOURS),
                    json.dumps(data, default=str),
                )
            except Exception as e:
                print(f"Redis error: {e}")
                # Fallback to memory
                self._memory_storage[session_id] = data
        else:
            # In-memory storage
            self._memory_storage[session_id] = data

    async def _get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data"""
        if self.redis_client:
            try:
                data = self.redis_client.get(f"session:{session_id}")
                if data:
                    return json.loads(data)
            except Exception as e:
                print(f"Redis error: {e}")
                # Fallback to memory
                return self._memory_storage.get(session_id)
        else:
            # In-memory storage
            return self._memory_storage.get(session_id)

        return None

    async def _delete_session(self, session_id: str):
        """Delete session data"""
        if self.redis_client:
            try:
                self.redis_client.delete(f"session:{session_id}")
            except Exception as e:
                print(f"Redis error: {e}")
                # Fallback to memory
                self._memory_storage.pop(session_id, None)
        else:
            # In-memory storage
            self._memory_storage.pop(session_id, None)

    async def get_active_sessions_count(self) -> int:
        """Get count of active sessions"""
        if self.redis_client:
            try:
                keys = self.redis_client.keys("session:*")
                return len(keys)
            except Exception:
                return len(self._memory_storage)
        else:
            return len(self._memory_storage)
