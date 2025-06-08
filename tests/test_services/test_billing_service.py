"""Tests for billing service"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.orm import Session as DBSession

from api.app.database.models import Subscription, User
from api.app.services.billing_service import BillingService


class TestBillingService:
    """Test BillingService operations"""

    @pytest.fixture
    def billing_service(self, db_session: DBSession):
        """Create billing service with test session"""
        return BillingService(db_session)

    @pytest.fixture
    def sample_user(self, db_session: DBSession):
        """Create sample user for testing"""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            tier="FREE",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def sample_subscription(self, db_session: DBSession, sample_user: User):
        """Create sample subscription for testing"""
        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="ACTIVE",
            stripe_customer_id="cus_test_123",
            stripe_subscription_id="sub_test_123",
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        return subscription

    @pytest.mark.asyncio
    @patch("api.app.services.billing_service.stripe")
    @patch("api.app.services.billing_service.settings")
    async def test_create_checkout_session_success(
        self,
        mock_settings,
        mock_stripe,
        billing_service: BillingService,
        sample_user: User,
    ):
        """Test creating checkout session successfully"""
        # Mock settings
        mock_settings.stripe_configured = True
        mock_settings.STRIPE_PRO_PRICE_ID = "price_test_123"

        # Mock Stripe responses
        mock_customer = MagicMock()
        mock_customer.id = "cus_test_456"
        mock_stripe.Customer.create.return_value = mock_customer

        mock_session = MagicMock()
        mock_session.id = "cs_test_789"
        mock_session.url = "https://checkout.stripe.com/session"
        mock_stripe.checkout.Session.create.return_value = mock_session

        result = await billing_service.create_checkout_session(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel",
        )

        assert result["checkout_url"] == "https://checkout.stripe.com/session"
        assert result["session_id"] == "cs_test_789"

        # Verify Stripe calls
        mock_stripe.Customer.create.assert_called_once()
        mock_stripe.checkout.Session.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_checkout_session_stripe_not_configured(
        self, billing_service: BillingService, sample_user: User
    ):
        """Test creating checkout session when Stripe is not configured"""
        with patch("api.app.services.billing_service.settings") as mock_settings:
            mock_settings.stripe_configured = False

            with pytest.raises(ValueError, match="Stripe is not configured"):
                await billing_service.create_checkout_session(
                    user_id=str(sample_user.id),
                    tier="PRO",
                    subscription_type="MONTHLY",
                    success_url="https://example.com/success",
                    cancel_url="https://example.com/cancel",
                )

    @pytest.mark.asyncio
    async def test_create_checkout_session_user_not_found(
        self, billing_service: BillingService
    ):
        """Test creating checkout session for non-existent user"""
        with patch("api.app.services.billing_service.settings") as mock_settings:
            mock_settings.stripe_configured = True

            fake_user_id = str(uuid.uuid4())
            with pytest.raises(ValueError, match="User not found"):
                await billing_service.create_checkout_session(
                    user_id=fake_user_id,
                    tier="PRO",
                    subscription_type="MONTHLY",
                    success_url="https://example.com/success",
                    cancel_url="https://example.com/cancel",
                )

    @pytest.mark.asyncio
    @patch("api.app.services.billing_service.stripe")
    @patch("api.app.services.billing_service.settings")
    async def test_create_billing_portal_session_success(
        self,
        mock_settings,
        mock_stripe,
        billing_service: BillingService,
        sample_user: User,
        sample_subscription: Subscription,
    ):
        """Test creating billing portal session successfully"""
        mock_settings.stripe_configured = True

        mock_session = MagicMock()
        mock_session.url = "https://billing.stripe.com/session"
        mock_stripe.billing_portal.Session.create.return_value = mock_session

        result = await billing_service.create_billing_portal_session(
            user_id=str(sample_user.id),
            return_url="https://example.com/account",
        )

        assert result["portal_url"] == "https://billing.stripe.com/session"
        mock_stripe.billing_portal.Session.create.assert_called_once_with(
            customer="cus_test_123",
            return_url="https://example.com/account",
        )

    @pytest.mark.asyncio
    async def test_create_billing_portal_session_no_subscription(
        self, billing_service: BillingService, sample_user: User
    ):
        """Test creating billing portal session without active subscription"""
        with patch("api.app.services.billing_service.settings") as mock_settings:
            mock_settings.stripe_configured = True

            with pytest.raises(ValueError, match="No active subscription found"):
                await billing_service.create_billing_portal_session(
                    user_id=str(sample_user.id),
                    return_url="https://example.com/account",
                )

    @pytest.mark.asyncio
    async def test_get_user_subscription(
        self,
        billing_service: BillingService,
        sample_user: User,
        sample_subscription: Subscription,
    ):
        """Test getting user's subscription"""
        subscription = await billing_service.get_user_subscription(str(sample_user.id))

        assert subscription is not None
        assert subscription.id == sample_subscription.id
        assert subscription.user_id == sample_user.id
        assert subscription.tier == "PRO"

    @pytest.mark.asyncio
    async def test_get_user_subscription_not_found(
        self, billing_service: BillingService, sample_user: User
    ):
        """Test getting user's subscription when none exists"""
        subscription = await billing_service.get_user_subscription(str(sample_user.id))

        assert subscription is None

    @pytest.mark.asyncio
    async def test_get_user_payments(
        self, billing_service: BillingService, sample_user: User, db_session: DBSession
    ):
        """Test getting user's payment history"""
        import time

        from api.app.database.models import Payment

        # Create test payments with small delay to ensure different timestamps
        payment1 = Payment(
            user_id=sample_user.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
            description="Payment 1",
        )
        db_session.add(payment1)
        db_session.commit()

        # Small delay to ensure different created_at timestamps
        time.sleep(0.01)

        payment2 = Payment(
            user_id=sample_user.id,
            amount=199,
            currency="USD",
            status="SUCCEEDED",
            description="Payment 2",
        )
        db_session.add(payment2)
        db_session.commit()

        payments = await billing_service.get_user_payments(str(sample_user.id))

        assert len(payments) == 2
        # Verify we have both payments, order may vary without explicit sorting
        payment_descriptions = [p.description for p in payments]
        assert "Payment 1" in payment_descriptions
        assert "Payment 2" in payment_descriptions

    @pytest.mark.asyncio
    @patch("api.app.services.billing_service.stripe")
    async def test_cancel_subscription_success(
        self,
        mock_stripe,
        billing_service: BillingService,
        sample_user: User,
        sample_subscription: Subscription,
    ):
        """Test cancelling subscription successfully"""
        mock_stripe.Subscription.modify.return_value = MagicMock()

        result = await billing_service.cancel_subscription(str(sample_user.id))

        assert result is True
        mock_stripe.Subscription.modify.assert_called_once_with(
            "sub_test_123",
            cancel_at_period_end=True,
        )

        # Refresh subscription from database
        from api.app.repositories.subscription_repository import SubscriptionRepository

        subscription_repo = SubscriptionRepository(billing_service.db)
        updated_subscription = subscription_repo.get_by_id(str(sample_subscription.id))
        assert updated_subscription.status == "CANCELLED"
        assert updated_subscription.cancelled_at is not None

    @pytest.mark.asyncio
    async def test_cancel_subscription_not_found(
        self, billing_service: BillingService, sample_user: User
    ):
        """Test cancelling subscription when none exists"""
        with pytest.raises(ValueError, match="No active subscription found"):
            await billing_service.cancel_subscription(str(sample_user.id))

    @pytest.mark.asyncio
    @patch("api.app.services.billing_service.stripe")
    async def test_handle_checkout_completed_webhook(
        self,
        mock_stripe,
        billing_service: BillingService,
        sample_user: User,
    ):
        """Test handling checkout.session.completed webhook"""
        # Mock Stripe subscription
        mock_subscription = MagicMock()
        mock_subscription.id = "sub_new_123"
        mock_subscription.customer = "cus_new_456"
        mock_subscription.current_period_start = 1640995200  # 2022-01-01
        mock_subscription.current_period_end = 1643673600  # 2022-02-01
        mock_subscription.__getitem__ = lambda self, key: {
            "items": {"data": [{"price": {"id": "price_test_123"}}]}
        }[key]
        mock_stripe.Subscription.retrieve.return_value = mock_subscription

        event_data = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "subscription": "sub_new_123",
                    "metadata": {
                        "user_id": str(sample_user.id),
                        "tier": "PRO",
                        "subscription_type": "MONTHLY",
                    },
                }
            },
        }

        result = await billing_service.handle_webhook_event(event_data)

        assert result is True

        # Verify subscription was created
        from api.app.repositories.subscription_repository import SubscriptionRepository

        subscription_repo = SubscriptionRepository(billing_service.db)
        subscription = subscription_repo.get_by_user_id(str(sample_user.id))
        assert subscription is not None
        assert subscription.tier == "PRO"
        assert subscription.stripe_subscription_id == "sub_new_123"

        # Verify user tier was updated
        from api.app.repositories.user_repository import UserRepository

        user_repo = UserRepository(billing_service.db)
        updated_user = user_repo.get_by_id(str(sample_user.id))
        assert updated_user.tier == "PRO"

    @pytest.mark.asyncio
    async def test_handle_payment_succeeded_webhook(
        self,
        billing_service: BillingService,
        sample_user: User,
        sample_subscription: Subscription,
    ):
        """Test handling invoice.payment_succeeded webhook"""
        event_data = {
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "id": "in_test_123",
                    "subscription": "sub_test_123",
                    "amount_paid": 299,
                    "currency": "usd",
                }
            },
        }

        result = await billing_service.handle_webhook_event(event_data)

        assert result is True

        # Verify payment was created
        from api.app.repositories.payment_repository import PaymentRepository

        payment_repo = PaymentRepository(billing_service.db)
        payments = payment_repo.get_by_user_id(str(sample_user.id))
        assert len(payments) == 1
        assert payments[0].amount == 299
        assert payments[0].status == "SUCCEEDED"
        assert payments[0].stripe_invoice_id == "in_test_123"

    @pytest.mark.asyncio
    async def test_handle_unknown_webhook_event(self, billing_service: BillingService):
        """Test handling unknown webhook event"""
        event_data = {
            "type": "unknown.event.type",
            "data": {"object": {}},
        }

        result = await billing_service.handle_webhook_event(event_data)

        assert result is True  # Should ignore unknown events
