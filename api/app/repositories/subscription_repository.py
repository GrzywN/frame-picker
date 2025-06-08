"""Subscription repository"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session as DBSession

from ..database.models import Subscription
from .base import BaseRepository


class SubscriptionRepository(BaseRepository[Subscription]):
    """Repository for subscription operations"""

    def __init__(self, db: DBSession):
        super().__init__(Subscription, db)

    def get_by_user_id(self, user_id: str) -> Optional[Subscription]:
        """Get active subscription by user ID"""
        return (
            self.db.query(Subscription)
            .filter(Subscription.user_id == user_id, Subscription.status == "ACTIVE")
            .first()
        )

    def get_by_stripe_subscription_id(
        self, stripe_subscription_id: str
    ) -> Optional[Subscription]:
        """Get subscription by Stripe subscription ID"""
        return (
            self.db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == stripe_subscription_id)
            .first()
        )

    def create_subscription(
        self,
        user_id: str,
        tier: str,
        subscription_type: str,
        stripe_subscription_id: str = None,
        stripe_customer_id: str = None,
        stripe_price_id: str = None,
        current_period_start: datetime = None,
        current_period_end: datetime = None,
    ) -> Subscription:
        """Create new subscription"""
        return self.create(
            user_id=user_id,
            tier=tier,
            subscription_type=subscription_type,
            status="ACTIVE",
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=stripe_customer_id,
            stripe_price_id=stripe_price_id,
            current_period_start=current_period_start,
            current_period_end=current_period_end,
        )

    def update_subscription_status(
        self,
        subscription: Subscription,
        status: str,
        cancelled_at: datetime = None,
        ended_at: datetime = None,
    ) -> Subscription:
        """Update subscription status"""
        update_data = {"status": status}

        if cancelled_at:
            update_data["cancelled_at"] = cancelled_at
        if ended_at:
            update_data["ended_at"] = ended_at

        return self.update(subscription, **update_data)
