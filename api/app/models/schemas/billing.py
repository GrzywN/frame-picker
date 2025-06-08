"""Billing related schemas"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from ...enums import (
    PaymentStatusEnum,
    SubscriptionStatusEnum,
    SubscriptionTypeEnum,
    TierEnum,
)


class SubscriptionCreate(BaseModel):
    """Request model for creating a subscription"""

    tier: TierEnum
    subscription_type: SubscriptionTypeEnum = Field(
        default=SubscriptionTypeEnum.monthly
    )


class SubscriptionResponse(BaseModel):
    """Response model for subscription operations"""

    id: str
    user_id: str
    tier: TierEnum
    subscription_type: SubscriptionTypeEnum
    status: SubscriptionStatusEnum
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None


class PaymentCreate(BaseModel):
    """Request model for creating a payment"""

    amount: int = Field(..., gt=0, description="Amount in cents")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    description: Optional[str] = None


class PaymentResponse(BaseModel):
    """Response model for payment operations"""

    id: str
    user_id: str
    subscription_id: Optional[str] = None
    amount: int
    currency: str
    status: PaymentStatusEnum
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None


class CheckoutSessionCreate(BaseModel):
    """Request model for creating a Stripe checkout session"""

    tier: TierEnum
    subscription_type: SubscriptionTypeEnum = Field(
        default=SubscriptionTypeEnum.monthly
    )
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    """Response model for checkout session creation"""

    checkout_url: str
    session_id: str


class BillingPortalResponse(BaseModel):
    """Response model for billing portal URL"""

    portal_url: str
