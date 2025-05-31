"""
Billing plans and tier definitions
"""

from enum import Enum
from typing import Dict, List

from ..config import settings


class TierEnum(str, Enum):
    """Available subscription tiers"""

    FREE = "free"
    PRO = "pro"


class BillingPlan:
    """Represents a billing plan with features and limits"""

    def __init__(
        self,
        tier: TierEnum,
        name: str,
        price_cents: int,
        description: str,
        features: List[str],
        limits: Dict[str, any],
    ):
        self.tier = tier
        self.name = name
        self.price_cents = price_cents
        self.price_dollars = price_cents / 100
        self.description = description
        self.features = features
        self.limits = limits

    @property
    def is_free(self) -> bool:
        return self.tier == TierEnum.FREE

    @property
    def stripe_price_id(self) -> str:
        """Get Stripe price ID for this plan"""
        if self.tier == TierEnum.PRO:
            return settings.STRIPE_PRO_PRICE_ID
        return None


# Plan definitions
PLANS = {
    TierEnum.FREE: BillingPlan(
        tier=TierEnum.FREE,
        name="Free",
        price_cents=0,
        description="Perfect for trying out Frame Picker",
        features=[
            "3 videos per month",
            "Up to 3 frames per video",
            "720p resolution",
            "50MB file limit",
            "Basic processing",
        ],
        limits={
            "videos_per_month": 3,
            "frames_per_video": 3,
            "max_file_size": 50 * 1024 * 1024,  # 50MB
            "max_resolution": "720p",
            "has_watermark": True,
            "priority_processing": False,
            "api_access": False,
        },
    ),
    TierEnum.PRO: BillingPlan(
        tier=TierEnum.PRO,
        name="Pro",
        price_cents=299,  # $2.99
        description="For content creators and professionals",
        features=[
            "100 videos per month",
            "Up to 10 frames per video",
            "1080p HD resolution",
            "500MB file limit",
            "No watermarks",
            "Priority processing",
            "API access",
            "Email support",
        ],
        limits={
            "videos_per_month": 100,
            "frames_per_video": 10,
            "max_file_size": 500 * 1024 * 1024,  # 500MB
            "max_resolution": "1080p",
            "has_watermark": False,
            "priority_processing": True,
            "api_access": True,
        },
    ),
}


def get_plan(tier: str) -> BillingPlan:
    """Get plan by tier name"""
    tier_enum = TierEnum(tier.lower())
    return PLANS[tier_enum]


def get_all_plans() -> List[BillingPlan]:
    """Get all available plans"""
    return list(PLANS.values())


def get_plan_by_stripe_price_id(price_id: str) -> BillingPlan:
    """Get plan by Stripe price ID"""
    for plan in PLANS.values():
        if plan.stripe_price_id == price_id:
            return plan
    raise ValueError(f"No plan found for Stripe price ID: {price_id}")


def can_upgrade_to(current_tier: str, target_tier: str) -> bool:
    """Check if user can upgrade from current to target tier"""
    tier_order = [TierEnum.FREE, TierEnum.PRO]

    try:
        current_index = tier_order.index(TierEnum(current_tier.lower()))
        target_index = tier_order.index(TierEnum(target_tier.lower()))
        return target_index > current_index
    except ValueError:
        return False


def get_usage_percentage(tier: str, usage_type: str, current_usage: int) -> float:
    """Calculate usage percentage for a specific limit"""
    plan = get_plan(tier)
    limit = plan.limits.get(usage_type)

    if limit == -1:  # Unlimited
        return 0.0

    if limit == 0:
        return 100.0

    percentage = (current_usage / limit) * 100
    return min(percentage, 100.0)


def is_usage_exceeded(tier: str, usage_type: str, current_usage: int) -> bool:
    """Check if usage limit is exceeded"""
    plan = get_plan(tier)
    limit = plan.limits.get(usage_type)

    if limit == -1:  # Unlimited
        return False

    return current_usage >= limit


def get_next_reset_date() -> str:
    """Get next monthly reset date (1st of next month)"""
    import calendar
    from datetime import datetime, timedelta

    now = datetime.now()
    # First day of next month
    if now.month == 12:
        next_month = datetime(now.year + 1, 1, 1)
    else:
        next_month = datetime(now.year, now.month + 1, 1)

    return next_month.strftime("%B %d, %Y")
