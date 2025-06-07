"""Authentication endpoints"""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database.connection import get_db
from ..dependencies import get_current_user
from ..models import CurrentUser, TokenResponse, UserCreate, UserLogin, UserResponse
from ..repositories.user_repository import UserRepository
from ..services.usage_service import UsageService
from ..utils.jwt import create_access_token
from ..utils.password import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    user_repo = UserRepository(db)

    # Check if user already exists
    existing_user = user_repo.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Hash password and create user
    password_hash = hash_password(user_data.password)
    user = user_repo.create_user(
        email=user_data.email, password_hash=password_hash, tier="FREE"
    )

    # Create access token
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    # Return token and user info
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        tier=user.tier,
        is_active=user.is_active,
        created_at=user.created_at,
    )

    return TokenResponse(
        access_token=access_token, token_type="bearer", user=user_response
    )


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    user_repo = UserRepository(db)

    # Get user by email
    user = user_repo.get_by_email(login_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    # Return token and user info
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        tier=user.tier,
        is_active=user.is_active,
        created_at=user.created_at,
    )

    return TokenResponse(
        access_token=access_token, token_type="bearer", user=user_response
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        tier=current_user.tier,
        is_active=current_user.is_active,
        created_at=(
            current_user.created_at if hasattr(current_user, "created_at") else None
        ),
    )


@router.get("/usage", response_model=dict)
async def get_usage_stats(
    current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get current user's usage statistics"""
    usage_service = UsageService(db)
    return usage_service.get_usage_stats(user_id=current_user.id)
