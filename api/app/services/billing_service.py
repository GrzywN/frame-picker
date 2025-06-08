"""Billing service with Stripe integration"""

from datetime import datetime, timezone
from typing import Dict, List, Optional

import stripe
from sqlalchemy.orm import Session as DBSession

from ..config import settings
from ..database.models import Payment, Subscription, User
from ..repositories.payment_repository import PaymentRepository
from ..repositories.subscription_repository import SubscriptionRepository
from ..repositories.user_repository import UserRepository

# Configure Stripe
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Service for handling billing operations with Stripe"""

    def __init__(self, db: DBSession):
        self.db = db
        self.subscription_repo = SubscriptionRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.user_repo = UserRepository(db)

    async def create_checkout_session(
        self,
        user_id: str,
        tier: str,
        subscription_type: str,
        success_url: str,
        cancel_url: str,
    ) -> Dict[str, str]:
        """Create Stripe checkout session for subscription"""
        if not settings.stripe_configured:
            raise ValueError("Stripe is not configured")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Get price ID based on tier and subscription type
        price_id = self._get_price_id(tier, subscription_type)
        if not price_id:
            raise ValueError(f"No price configured for {tier} {subscription_type}")

        try:
            # Create or get Stripe customer
            customer_id = await self._get_or_create_stripe_customer(user)

            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": user_id,
                    "tier": tier,
                    "subscription_type": subscription_type,
                },
            )

            return {
                "checkout_url": session.url,
                "session_id": session.id,
            }

        except stripe.error.StripeError as e:
            raise ValueError(f"Stripe error: {str(e)}")

    async def create_billing_portal_session(
        self, user_id: str, return_url: str
    ) -> Dict[str, str]:
        """Create Stripe billing portal session"""
        if not settings.stripe_configured:
            raise ValueError("Stripe is not configured")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        subscription = self.subscription_repo.get_by_user_id(user_id)
        if not subscription or not subscription.stripe_customer_id:
            raise ValueError("No active subscription found")

        try:
            session = stripe.billing_portal.Session.create(
                customer=subscription.stripe_customer_id,
                return_url=return_url,
            )

            return {"portal_url": session.url}

        except stripe.error.StripeError as e:
            raise ValueError(f"Stripe error: {str(e)}")

    async def handle_webhook_event(self, event_data: dict) -> bool:
        """Handle Stripe webhook events"""
        event_type = event_data.get("type")

        if event_type == "checkout.session.completed":
            return await self._handle_checkout_completed(event_data)
        elif event_type == "invoice.payment_succeeded":
            return await self._handle_payment_succeeded(event_data)
        elif event_type == "invoice.payment_failed":
            return await self._handle_payment_failed(event_data)
        elif event_type == "customer.subscription.updated":
            return await self._handle_subscription_updated(event_data)
        elif event_type == "customer.subscription.deleted":
            return await self._handle_subscription_cancelled(event_data)

        return True  # Ignore unknown events

    async def get_user_subscription(self, user_id: str) -> Optional[Subscription]:
        """Get user's active subscription"""
        return self.subscription_repo.get_by_user_id(user_id)

    async def get_user_payments(self, user_id: str, limit: int = 50) -> List[Payment]:
        """Get user's payment history"""
        return self.payment_repo.get_by_user_id(user_id, limit)

    async def cancel_subscription(self, user_id: str) -> bool:
        """Cancel user's subscription"""
        subscription = self.subscription_repo.get_by_user_id(user_id)
        if not subscription:
            raise ValueError("No active subscription found")

        if not subscription.stripe_subscription_id:
            # Local subscription - just update status
            self.subscription_repo.update_subscription_status(
                subscription,
                "CANCELLED",
                cancelled_at=datetime.now(timezone.utc),
            )
            return True

        try:
            # Cancel in Stripe
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True,
            )

            # Update local status
            self.subscription_repo.update_subscription_status(
                subscription,
                "CANCELLED",
                cancelled_at=datetime.now(timezone.utc),
            )

            return True

        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to cancel subscription: {str(e)}")

    def _get_price_id(self, tier: str, subscription_type: str) -> Optional[str]:
        """Get Stripe price ID for tier and subscription type"""
        # This would typically come from configuration or database
        price_mapping = {
            ("PRO", "MONTHLY"): settings.STRIPE_PRO_PRICE_ID,
            # Add more mappings as needed
        }

        return price_mapping.get((tier, subscription_type))

    async def _get_or_create_stripe_customer(self, user: User) -> str:
        """Get existing or create new Stripe customer"""
        # Check if user already has a subscription with customer ID
        subscription = self.subscription_repo.get_by_user_id(str(user.id))
        if subscription and subscription.stripe_customer_id:
            return subscription.stripe_customer_id

        # Create new customer
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": str(user.id)},
        )

        return customer.id

    async def _handle_checkout_completed(self, event_data: dict) -> bool:
        """Handle completed checkout session"""
        session = event_data["data"]["object"]
        user_id = session["metadata"]["user_id"]
        tier = session["metadata"]["tier"]
        subscription_type = session["metadata"]["subscription_type"]

        # Get subscription details from Stripe
        stripe_subscription = stripe.Subscription.retrieve(session["subscription"])

        # Create subscription record
        self.subscription_repo.create_subscription(
            user_id=user_id,
            tier=tier,
            subscription_type=subscription_type,
            stripe_subscription_id=stripe_subscription.id,
            stripe_customer_id=stripe_subscription.customer,
            stripe_price_id=stripe_subscription["items"]["data"][0]["price"]["id"],
            current_period_start=datetime.fromtimestamp(
                stripe_subscription.current_period_start, tz=timezone.utc
            ),
            current_period_end=datetime.fromtimestamp(
                stripe_subscription.current_period_end, tz=timezone.utc
            ),
        )

        # Update user tier
        user = self.user_repo.get_by_id(user_id)
        if user:
            self.user_repo.update_user_tier(user, tier)

        return True

    async def _handle_payment_succeeded(self, event_data: dict) -> bool:
        """Handle successful payment"""
        invoice = event_data["data"]["object"]

        if invoice.get("subscription"):
            subscription = self.subscription_repo.get_by_stripe_subscription_id(
                invoice["subscription"]
            )
            if subscription:
                self.payment_repo.create_payment(
                    user_id=str(subscription.user_id),
                    subscription_id=str(subscription.id),
                    amount=invoice["amount_paid"],
                    currency=invoice["currency"].upper(),
                    status="SUCCEEDED",
                    stripe_invoice_id=invoice["id"],
                    description=f"Subscription payment for {subscription.tier}",
                )

        return True

    async def _handle_payment_failed(self, event_data: dict) -> bool:
        """Handle failed payment"""
        invoice = event_data["data"]["object"]

        if invoice.get("subscription"):
            subscription = self.subscription_repo.get_by_stripe_subscription_id(
                invoice["subscription"]
            )
            if subscription:
                self.payment_repo.create_payment(
                    user_id=str(subscription.user_id),
                    subscription_id=str(subscription.id),
                    amount=invoice["amount_due"],
                    currency=invoice["currency"].upper(),
                    status="FAILED",
                    stripe_invoice_id=invoice["id"],
                    description=f"Failed subscription payment for {subscription.tier}",
                )

        return True

    async def _handle_subscription_updated(self, event_data: dict) -> bool:
        """Handle subscription updates"""
        stripe_subscription = event_data["data"]["object"]

        subscription = self.subscription_repo.get_by_stripe_subscription_id(
            stripe_subscription["id"]
        )

        if subscription:
            # Update subscription details
            update_data = {
                "status": stripe_subscription["status"].upper(),
                "current_period_start": datetime.fromtimestamp(
                    stripe_subscription["current_period_start"], tz=timezone.utc
                ),
                "current_period_end": datetime.fromtimestamp(
                    stripe_subscription["current_period_end"], tz=timezone.utc
                ),
            }

            if stripe_subscription.get("canceled_at"):
                update_data["cancelled_at"] = datetime.fromtimestamp(
                    stripe_subscription["canceled_at"], tz=timezone.utc
                )

            self.subscription_repo.update(subscription, **update_data)

        return True

    async def _handle_subscription_cancelled(self, event_data: dict) -> bool:
        """Handle subscription cancellation"""
        stripe_subscription = event_data["data"]["object"]

        subscription = self.subscription_repo.get_by_stripe_subscription_id(
            stripe_subscription["id"]
        )

        if subscription:
            self.subscription_repo.update_subscription_status(
                subscription,
                "CANCELLED",
                ended_at=datetime.now(timezone.utc),
            )

            # Downgrade user to FREE tier
            user = self.user_repo.get_by_id(str(subscription.user_id))
            if user:
                self.user_repo.update_user_tier(user, "FREE")

        return True
