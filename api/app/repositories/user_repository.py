"""User repository"""

from typing import Optional

from sqlalchemy.orm import Session as DBSession

from ..database.models.user import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for user operations"""

    def __init__(self, db: DBSession):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def create_user(self, email: str, password_hash: str, tier: str = "FREE") -> User:
        """Create new user"""
        return self.create(
            email=email, password_hash=password_hash, tier=tier, is_active=True
        )

    def update_user_tier(self, user: User, tier: str) -> User:
        """Update user tier"""
        return self.update(user, tier=tier)

    def deactivate_user(self, user: User) -> User:
        """Deactivate user"""
        return self.update(user, is_active=False)

    def activate_user(self, user: User) -> User:
        """Activate user"""
        return self.update(user, is_active=True)
