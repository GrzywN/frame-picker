"""Authentication models"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from ..enums.tier import Tier


class UserCreate(BaseModel):
    """User registration model"""

    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """User login model"""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response model"""

    id: str
    email: str
    tier: Tier
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token response"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CurrentUser(BaseModel):
    """Current authenticated user"""

    id: str
    email: str
    tier: Tier
    is_active: bool
