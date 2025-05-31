"""
Billing service for user management and subscription handling
"""

from datetime import date, datetime, timezone
from typing import Dict, Optional, Tuple

from sqlalchemy import and_
from sqlalchemy.orm import Session as DBSession

from ..billing.plans import TierEnum, get_plan, get_plan_by_stripe_price_id
from ..billing.stripe_client import StripeClient
from ..config import settings
from ..database.billing_models import PaymentHistory, Subscription, UsageTracking, User


class BillingService:
    """Handle billing operations and user management"""

    def __init__(self, db: DBSession):
        self.db = db
        self.stripe = StripeClient()

    # User Management
    def get_or_create_user(self, email: str) -> User:
        """Get existing user or create new one"""
        user = self.db.query(User).filter(User.email == email).first()

        if not user:
            # Create Stripe customer
            stripe_customer = self.stripe.create_customer(email)

            # Create user in database
            user = User(
                email=email, stripe_customer_id=stripe_customer.id, current_tier="free"
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

        return user

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_stripe_customer_id(self, customer_id: str) -> Optional[User]:
        """Get user by Stripe customer ID"""
        return (
            self.db.query(User).filter(User.stripe_customer_id == customer_id).first()
        )

    # Subscription Management
    def create_checkout_session(self, user: User, tier: str = "pro") -> str:
        """Create Stripe checkout session for subscription"""
        if not user.stripe_customer_id:
            raise ValueError("User has no Stripe customer ID")

        plan = get_plan(tier)
        if not plan.stripe_price_id:
            raise ValueError(f"No Stripe price ID configured for tier: {tier}")

        success_url = f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{settings.FRONTEND_URL}/billing/canceled"

        checkout_session = self.stripe.create_checkout_session(
            customer_id=user.stripe_customer_id,
            price_id=plan.stripe_price_id,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": str(user.id), "tier": tier},
        )

        return checkout_session.url

    def create_billing_portal_session(self, user: User) -> str:
        """Create Stripe billing portal session"""
        if not user.stripe_customer_id:
            raise ValueError("User has no Stripe customer ID")

        return_url = f"{settings.FRONTEND_URL}/billing"

        portal_session = self.stripe.create_billing_portal_session(
            customer_id=user.stripe_customer_id, return_url=return_url
        )

        return portal_session.url

    def get_user_subscription(self, user: User) -> Optional[Subscription]:
        """Get user's active subscription"""
        return (
            self.db.query(Subscription)
            .filter(
                and_(
                    Subscription.user_id == user.id,
                    Subscription.status.in_(["active", "trialing", "past_due"]),
                )
            )
            .first()
        )

    def update_user_tier(self, user: User, new_tier: str) -> User:
        """Update user's current tier"""
        user.current_tier = new_tier
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user

    # Usage Tracking
    def get_current_usage(self, user: User) -> UsageTracking:
        """Get or create current month's usage tracking"""
        current_month = date.today().replace(day=1)

        usage = (
            self.db.query(UsageTracking)
            .filter(
                and_(
                    UsageTracking.user_id == user.id,
                    UsageTracking.month == current_month,
                )
            )
            .first()
        )

        if not usage:
            usage = UsageTracking(
                user_id=user.id,
                month=current_month,
                videos_processed=0,
                frames_extracted=0,
                storage_used_bytes=0,
                api_requests=0,
            )
            self.db.add(usage)
            self.db.commit()
            self.db.refresh(usage)

        return usage

    def increment_usage(
        self, user: User, usage_type: str, amount: int = 1
    ) -> UsageTracking:
        """Increment usage counter for user"""
        usage = self.get_current_usage(user)

        if usage_type == "videos":
            usage.videos_processed += amount
        elif usage_type == "frames":
            usage.frames_extracted += amount
        elif usage_type == "api_requests":
            usage.api_requests += amount
        elif usage_type == "storage":
            usage.storage_used_bytes += amount
        else:
            raise ValueError(f"Unknown usage type: {usage_type}")

        usage.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(usage)
        return usage

    def check_usage_limits(self, user: User) -> Dict[str, any]:
        """Check if user is within usage limits"""
        plan = get_plan(user.current_tier)
        usage = self.get_current_usage(user)

        limits = plan.limits
        result = {
            "within_limits": True,
            "usage": {
                "videos_processed": usage.videos_processed,
                "frames_extracted": usage.frames_extracted,
                "storage_used_mb": round(usage.storage_used_bytes / (1024 * 1024), 2),
                "api_requests": usage.api_requests,
            },
            "limits": limits,
            "exceeded": [],
        }

        # Check video limit
        if (
            limits["videos_per_month"] != -1
            and usage.videos_processed >= limits["videos_per_month"]
        ):
            result["within_limits"] = False
            result["exceeded"].append("videos_per_month")

        # Check file size would be checked per upload, not cumulative

        return result

    def can_process_video(self, user: User, file_size: int) -> Tuple[bool, str]:
        """Check if user can process a video"""
        plan = get_plan(user.current_tier)
        usage_check = self.check_usage_limits(user)

        # Check monthly video limit
        if (
            not usage_check["within_limits"]
            and "videos_per_month" in usage_check["exceeded"]
        ):
            return (
                False,
                f"Monthly video limit reached ({plan.limits['videos_per_month']} videos). Upgrade to Pro for more.",
            )

        # Check file size limit
        if (
            plan.limits["max_file_size"] != -1
            and file_size > plan.limits["max_file_size"]
        ):
            max_size_mb = plan.limits["max_file_size"] / (1024 * 1024)
            return (
                False,
                f"File size exceeds {max_size_mb:.0f}MB limit. Upgrade to Pro for larger files.",
            )

        return True, "OK"

    # Webhook Handlers
    def handle_subscription_created(self, subscription_data: Dict) -> Subscription:
        """Handle subscription created webhook"""
        user = self.get_user_by_stripe_customer_id(
            subscription_data["stripe_customer_id"]
        )
        if not user:
            raise ValueError(
                f"User not found for customer: {subscription_data['stripe_customer_id']}"
            )

        # Get tier from price ID
        plan = get_plan_by_stripe_price_id(subscription_data["stripe_price_id"])

        subscription = Subscription(
            user_id=user.id,
            stripe_subscription_id=subscription_data["stripe_subscription_id"],
            stripe_price_id=subscription_data["stripe_price_id"],
            tier=plan.tier.value,
            status=subscription_data["status"],
            current_period_start=datetime.fromtimestamp(
                subscription_data["current_period_start"], timezone.utc
            ),
            current_period_end=datetime.fromtimestamp(
                subscription_data["current_period_end"], timezone.utc
            ),
        )

        self.db.add(subscription)

        # Update user tier
        self.update_user_tier(user, plan.tier.value)

        self.db.commit()
        self.db.refresh(subscription)
        return subscription

    def handle_subscription_updated(
        self, subscription_data: Dict
    ) -> Optional[Subscription]:
        """Handle subscription updated webhook"""
        subscription = (
            self.db.query(Subscription)
            .filter(
                Subscription.stripe_subscription_id
                == subscription_data["stripe_subscription_id"]
            )
            .first()
        )

        if not subscription:
            return None

        subscription.status = subscription_data["status"]
        subscription.current_period_start = datetime.fromtimestamp(
            subscription_data["current_period_start"], timezone.utc
        )
        subscription.current_period_end = datetime.fromtimestamp(
            subscription_data["current_period_end"], timezone.utc
        )
        subscription.cancel_at_period_end = subscription_data.get(
            "cancel_at_period_end", False
        )

        if subscription_data.get("canceled_at"):
            subscription.canceled_at = datetime.fromtimestamp(
                subscription_data["canceled_at"], timezone.utc
            )

        subscription.updated_at = datetime.now(timezone.utc)

        # Update user tier based on subscription status
        if subscription.status == "active":
            plan = get_plan_by_stripe_price_id(subscription.stripe_price_id)
            self.update_user_tier(subscription.user, plan.tier.value)
        elif subscription.status in ["canceled", "unpaid"]:
            self.update_user_tier(subscription.user, "free")

        self.db.commit()
        self.db.refresh(subscription)
        return subscription

    def handle_subscription_deleted(
        self, subscription_data: Dict
    ) -> Optional[Subscription]:
        """Handle subscription deleted webhook"""
        subscription = (
            self.db.query(Subscription)
            .filter(
                Subscription.stripe_subscription_id
                == subscription_data["stripe_subscription_id"]
            )
            .first()
        )

        if not subscription:
            return None

        subscription.status = "canceled"
        subscription.canceled_at = datetime.fromtimestamp(
            subscription_data["canceled_at"], timezone.utc
        )
        subscription.updated_at = datetime.now(timezone.utc)

        # Downgrade user to free tier
        self.update_user_tier(subscription.user, "free")

        self.db.commit()
        self.db.refresh(subscription)
        return subscription

    def handle_payment_succeeded(self, payment_data: Dict) -> PaymentHistory:
        """Handle successful payment webhook"""
        user = self.get_user_by_stripe_customer_id(payment_data["stripe_customer_id"])
        if not user:
            raise ValueError(
                f"User not found for customer: {payment_data['stripe_customer_id']}"
            )

        payment = PaymentHistory(
            user_id=user.id,
            stripe_invoice_id=payment_data["stripe_invoice_id"],
            amount_cents=payment_data["amount_cents"],
            currency=payment_data["currency"],
            status=payment_data["status"],
            description=payment_data["description"],
            paid_at=datetime.fromtimestamp(payment_data["paid_at"], timezone.utc),
        )

        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def handle_payment_failed(self, payment_data: Dict) -> PaymentHistory:
        """Handle failed payment webhook"""
        user = self.get_user_by_stripe_customer_id(payment_data["stripe_customer_id"])
        if not user:
            raise ValueError(
                f"User not found for customer: {payment_data['stripe_customer_id']}"
            )

        payment = PaymentHistory(
            user_id=user.id,
            stripe_invoice_id=payment_data["stripe_invoice_id"],
            amount_cents=payment_data["amount_cents"],
            currency=payment_data["currency"],
            status=payment_data["status"],
            description=payment_data["description"],
        )

        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment
