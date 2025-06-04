"""FastAPI dependencies"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database.connection import get_db
from .models.auth import CurrentUser
from .repositories.user_repository import UserRepository
from .services.processing_service import ProcessingService
from .services.session_service import SessionService
from .services.usage_service import UsageService
from .services.video_service import VideoService
from .utils.jwt import verify_token

security = HTTPBearer(auto_error=False)


def get_session_service(db: Session = Depends(get_db)) -> SessionService:
    """Dependency for SessionService with database session"""
    return SessionService(db)


def get_video_service(db: Session = Depends(get_db)) -> VideoService:
    """Dependency for VideoService with database session"""
    return VideoService(db)


def get_processing_service(db: Session = Depends(get_db)) -> ProcessingService:
    """Dependency for ProcessingService with database session"""
    return ProcessingService(db)


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """Dependency for UserRepository with database session"""
    return UserRepository(db)


def get_usage_service(db: Session = Depends(get_db)) -> UsageService:
    """Dependency for UsageService with database session"""
    return UsageService(db)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    user_repo: UserRepository = Depends(get_user_repository),
) -> Optional[CurrentUser]:
    """Get current user from JWT token (optional - returns None if not authenticated)"""
    if not credentials:
        return None

    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        return None

    return CurrentUser(
        id=str(user.id), email=user.email, tier=user.tier, is_active=user.is_active
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_repo: UserRepository = Depends(get_user_repository),
) -> CurrentUser:
    """Get current user from JWT token (required - raises 401 if not authenticated)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated"
        )

    return CurrentUser(
        id=str(user.id), email=user.email, tier=user.tier, is_active=user.is_active
    )
