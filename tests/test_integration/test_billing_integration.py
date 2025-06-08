"""Integration tests for billing system"""

import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from sqlalchemy.orm import Session as DBSession

from api.app.database.models import Payment, Subscription, User
from api.app.repositories.payment_repository import PaymentRepository
from api.app.repositories.subscription_repository import SubscriptionRepository
from api.app.repositories.user_repository import UserRepository
from api.app.services.billing_service import BillingService


class TestBillingIntegration:
    """Integration tests for billing system components"""

    @pytest.fixture
    def user_repo(self, db_session: DBSession):
        return UserRepository(db_session)

    @pytest.fixture
    def subscription_repo(self, db_session: DBSession):
        return SubscriptionRepository(db_session)

    @pytest.fixture
    def payment_repo(self, db_session: DBSession):
        return PaymentRepository(db_session)

    @pytest.fixture
    def billing_service(self, db_session: DBSession):
        return BillingService(db_session)

    @pytest.fixture
    def sample_user(self, user_repo: UserRepository):
        return user_repo.create_user(
            email="integration@example.com",
            password_hash="hashed_password",
            tier="FREE",
        )

    @pytest.mark.asyncio
    async def test_complete_subscription_flow(
        self,
        billing_service: BillingService,
        subscription_repo: SubscriptionRepository,
        payment_repo: PaymentRepository,
        user_repo: UserRepository,
        sample_user: User,
    ):
        """Test complete subscription flow from creation to cancellation"""

        # 1. User starts with FREE tier
        assert sample_user.tier == "FREE"

        # 2. Create subscription
        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
            stripe_subscription_id="sub_integration_test",
            stripe_customer_id="cus_integration_test",
            current_period_start=datetime.now(timezone.utc),
            current_period_end=datetime(2024, 12, 31, tzinfo=timezone.utc),
        )

        # 3. Update user tier to PRO
        user_repo.update_user_tier(sample_user, "PRO")
        updated_user = user_repo.get_by_id(str(sample_user.id))
        assert updated_user.tier == "PRO"

        # 4. Create successful payment for subscription
        payment = payment_repo.create_payment(
            user_id=str(sample_user.id),
            subscription_id=str(subscription.id),
            amount=299,
            currency="USD",
            status="SUCCEEDED",
            stripe_invoice_id="in_integration_test",
            description="Monthly PRO subscription",
        )

        # 5. Verify subscription is active
        active_subscription = await billing_service.get_user_subscription(
            str(sample_user.id)
        )
        assert active_subscription is not None
        assert active_subscription.tier == "PRO"
        assert active_subscription.status == "ACTIVE"

        # 6. Verify payment history
        payments = await billing_service.get_user_payments(str(sample_user.id))
        assert len(payments) == 1
        assert payments[0].amount == 299
        assert payments[0].status == "SUCCEEDED"

        # 7. Cancel subscription
        with patch("api.app.services.billing_service.stripe") as mock_stripe:
            mock_stripe.Subscription.modify.return_value = None

            success = await billing_service.cancel_subscription(str(sample_user.id))
            assert success is True

        # 8. Verify subscription is cancelled
        cancelled_subscription = subscription_repo.get_by_id(str(subscription.id))
        assert cancelled_subscription.status == "CANCELLED"
        assert cancelled_subscription.cancelled_at is not None

    @pytest.mark.asyncio
    async def test_webhook_subscription_creation_flow(
        self,
        billing_service: BillingService,
        user_repo: UserRepository,
        sample_user: User,
    ):
        """Test subscription creation via webhook"""

        # Mock Stripe subscription data
        with patch("api.app.services.billing_service.stripe") as mock_stripe:
            # Create a proper mock object with dictionary access
            class MockSubscription:
                def __init__(self):
                    self.id = "sub_webhook_test"
                    self.customer = "cus_webhook_test"
                    self.current_period_start = 1640995200  # 2022-01-01
                    self.current_period_end = 1643673600  # 2022-02-01

                def __getitem__(self, key):
                    if key == "items":
                        return {"data": [{"price": {"id": "price_test_pro"}}]}
                    raise KeyError(key)

            mock_stripe.Subscription.retrieve.return_value = MockSubscription()

            # Simulate checkout.session.completed webhook
            event_data = {
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "subscription": "sub_webhook_test",
                        "metadata": {
                            "user_id": str(sample_user.id),
                            "tier": "PRO",
                            "subscription_type": "MONTHLY",
                        },
                    }
                },
            }

            # Process webhook
            result = await billing_service.handle_webhook_event(event_data)
            assert result is True

            # Verify subscription was created
            subscription = await billing_service.get_user_subscription(
                str(sample_user.id)
            )
            assert subscription is not None
            assert subscription.tier == "PRO"
            assert subscription.stripe_subscription_id == "sub_webhook_test"

            # Verify user tier was updated
            updated_user = user_repo.get_by_id(str(sample_user.id))
            assert updated_user.tier == "PRO"

    @pytest.mark.asyncio
    async def test_payment_success_webhook_flow(
        self,
        billing_service: BillingService,
        subscription_repo: SubscriptionRepository,
        sample_user: User,
    ):
        """Test payment success via webhook"""

        # Create subscription first
        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
            stripe_subscription_id="sub_payment_test",
        )

        # Simulate invoice.payment_succeeded webhook
        event_data = {
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "id": "in_payment_test",
                    "subscription": "sub_payment_test",
                    "amount_paid": 299,
                    "currency": "usd",
                }
            },
        }

        # Process webhook
        result = await billing_service.handle_webhook_event(event_data)
        assert result is True

        # Verify payment was created
        payments = await billing_service.get_user_payments(str(sample_user.id))
        assert len(payments) == 1
        assert payments[0].amount == 299
        assert payments[0].status == "SUCCEEDED"
        assert payments[0].stripe_invoice_id == "in_payment_test"

    @pytest.mark.asyncio
    async def test_failed_payment_webhook_flow(
        self,
        billing_service: BillingService,
        subscription_repo: SubscriptionRepository,
        sample_user: User,
    ):
        """Test failed payment via webhook"""

        # Create subscription first
        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
            stripe_subscription_id="sub_failed_test",
        )

        # Simulate invoice.payment_failed webhook
        event_data = {
            "type": "invoice.payment_failed",
            "data": {
                "object": {
                    "id": "in_failed_test",
                    "subscription": "sub_failed_test",
                    "amount_due": 299,
                    "currency": "usd",
                }
            },
        }

        # Process webhook
        result = await billing_service.handle_webhook_event(event_data)
        assert result is True

        # Verify failed payment was recorded
        payments = await billing_service.get_user_payments(str(sample_user.id))
        assert len(payments) == 1
        assert payments[0].amount == 299
        assert payments[0].status == "FAILED"
        assert payments[0].stripe_invoice_id == "in_failed_test"

    @pytest.mark.asyncio
    async def test_subscription_cancellation_webhook_flow(
        self,
        billing_service: BillingService,
        subscription_repo: SubscriptionRepository,
        user_repo: UserRepository,
        sample_user: User,
    ):
        """Test subscription cancellation via webhook"""

        # Create active subscription and update user tier
        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
            stripe_subscription_id="sub_cancel_test",
        )
        user_repo.update_user_tier(sample_user, "PRO")

        # Simulate customer.subscription.deleted webhook
        event_data = {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_cancel_test",
                }
            },
        }

        # Process webhook
        result = await billing_service.handle_webhook_event(event_data)
        assert result is True

        # Verify subscription was cancelled
        cancelled_subscription = subscription_repo.get_by_id(str(subscription.id))
        assert cancelled_subscription.status == "CANCELLED"
        assert cancelled_subscription.ended_at is not None

        # Verify user was downgraded to FREE tier
        updated_user = user_repo.get_by_id(str(sample_user.id))
        assert updated_user.tier == "FREE"

    def test_repository_integration(
        self,
        user_repo: UserRepository,
        subscription_repo: SubscriptionRepository,
        payment_repo: PaymentRepository,
        sample_user: User,
    ):
        """Test integration between repositories"""

        # Create subscription
        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
        )

        # Create multiple payments
        for i in range(3):
            payment_repo.create_payment(
                user_id=str(sample_user.id),
                subscription_id=str(subscription.id),
                amount=299 + i,
                currency="USD",
                status="SUCCEEDED",
                description=f"Payment {i + 1}",
            )

        # Test relationships
        user_payments = payment_repo.get_by_user_id(str(sample_user.id))
        assert len(user_payments) == 3

        for payment in user_payments:
            assert payment.user_id == sample_user.id
            assert payment.subscription_id == subscription.id

        # Test subscription retrieval
        user_subscription = subscription_repo.get_by_user_id(str(sample_user.id))
        assert user_subscription.id == subscription.id
        assert user_subscription.user_id == sample_user.id

    @pytest.mark.asyncio
    async def test_billing_service_error_handling(
        self,
        billing_service: BillingService,
        sample_user: User,
    ):
        """Test billing service error handling"""

        # Test operations on non-existent user
        fake_user_id = str(uuid.uuid4())

        with pytest.raises(ValueError, match="User not found"):
            await billing_service.create_checkout_session(
                user_id=fake_user_id,
                tier="PRO",
                subscription_type="MONTHLY",
                success_url="https://example.com/success",
                cancel_url="https://example.com/cancel",
            )

        # Test operations on user without subscription
        with pytest.raises(ValueError, match="No active subscription found"):
            await billing_service.cancel_subscription(str(sample_user.id))

        with pytest.raises(ValueError, match="No active subscription found"):
            await billing_service.create_billing_portal_session(
                str(sample_user.id), "https://example.com/return"
            )

        # Test getting subscription for user without one
        subscription = await billing_service.get_user_subscription(str(sample_user.id))
        assert subscription is None

        # Test getting payments for user without any
        payments = await billing_service.get_user_payments(str(sample_user.id))
        assert len(payments) == 0
