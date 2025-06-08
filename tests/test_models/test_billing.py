"""
Tests for billing models
"""

import pytest
from pydantic import ValidationError

from api.app.enums import (
    PaymentStatusEnum,
    SubscriptionStatusEnum,
    SubscriptionTypeEnum,
    TierEnum,
)
from api.app.models.schemas.billing import (
    BillingPortalResponse,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    PaymentCreate,
    PaymentResponse,
    SubscriptionCreate,
    SubscriptionResponse,
)


class TestSubscriptionCreate:
    """Test SubscriptionCreate model"""

    def test_subscription_create_minimal(self):
        """Test SubscriptionCreate with minimal required fields"""
        subscription = SubscriptionCreate(tier=TierEnum.pro)

        assert subscription.tier == TierEnum.pro
        assert subscription.subscription_type == SubscriptionTypeEnum.monthly

    def test_subscription_create_full(self):
        """Test SubscriptionCreate with all fields"""
        subscription = SubscriptionCreate(
            tier=TierEnum.pro, subscription_type=SubscriptionTypeEnum.yearly
        )

        assert subscription.tier == TierEnum.pro
        assert subscription.subscription_type == SubscriptionTypeEnum.yearly

    def test_subscription_create_validation_error(self):
        """Test SubscriptionCreate validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            SubscriptionCreate()

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("tier",)
        assert errors[0]["type"] == "missing"


class TestSubscriptionResponse:
    """Test SubscriptionResponse model"""

    def test_subscription_response_creation(self, sample_session_id):
        """Test basic SubscriptionResponse creation"""
        response = SubscriptionResponse(
            id=sample_session_id,
            user_id="user-123",
            tier=TierEnum.pro,
            subscription_type=SubscriptionTypeEnum.monthly,
            status=SubscriptionStatusEnum.active,
        )

        assert response.id == sample_session_id
        assert response.user_id == "user-123"
        assert response.tier == TierEnum.pro
        assert response.subscription_type == SubscriptionTypeEnum.monthly
        assert response.status == SubscriptionStatusEnum.active
        assert response.current_period_start is None
        assert response.current_period_end is None
        assert response.created_at is None
        assert response.cancelled_at is None

    def test_subscription_response_validation_error(self):
        """Test SubscriptionResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            SubscriptionResponse(id="test-id")

        errors = exc_info.value.errors()
        assert len(errors) == 4
        required_fields = {error["loc"][0] for error in errors}
        assert required_fields == {"user_id", "tier", "subscription_type", "status"}


class TestPaymentCreate:
    """Test PaymentCreate model"""

    def test_payment_create_minimal(self):
        """Test PaymentCreate with minimal required fields"""
        payment = PaymentCreate(amount=299)

        assert payment.amount == 299
        assert payment.currency == "USD"
        assert payment.description is None

    def test_payment_create_full(self):
        """Test PaymentCreate with all fields"""
        payment = PaymentCreate(
            amount=1999, currency="EUR", description="Pro subscription"
        )

        assert payment.amount == 1999
        assert payment.currency == "EUR"
        assert payment.description == "Pro subscription"

    def test_payment_create_amount_validation(self):
        """Test PaymentCreate amount validation"""
        # Valid amount
        payment = PaymentCreate(amount=1)
        assert payment.amount == 1

        # Invalid amount (zero)
        with pytest.raises(ValidationError):
            PaymentCreate(amount=0)

        # Invalid amount (negative)
        with pytest.raises(ValidationError):
            PaymentCreate(amount=-100)

    def test_payment_create_currency_validation(self):
        """Test PaymentCreate currency validation"""
        # Valid currency
        payment = PaymentCreate(amount=100, currency="GBP")
        assert payment.currency == "GBP"

        # Invalid currency (too short)
        with pytest.raises(ValidationError):
            PaymentCreate(amount=100, currency="US")

        # Invalid currency (too long)
        with pytest.raises(ValidationError):
            PaymentCreate(amount=100, currency="USDT")


class TestPaymentResponse:
    """Test PaymentResponse model"""

    def test_payment_response_creation(self, sample_session_id):
        """Test basic PaymentResponse creation"""
        response = PaymentResponse(
            id="payment-123",
            user_id="user-456",
            amount=299,
            currency="USD",
            status=PaymentStatusEnum.succeeded,
        )

        assert response.id == "payment-123"
        assert response.user_id == "user-456"
        assert response.subscription_id is None
        assert response.amount == 299
        assert response.currency == "USD"
        assert response.status == PaymentStatusEnum.succeeded
        assert response.description is None
        assert response.created_at is None
        assert response.processed_at is None

    def test_payment_response_validation_error(self):
        """Test PaymentResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            PaymentResponse(id="test-id")

        errors = exc_info.value.errors()
        assert len(errors) == 4
        required_fields = {error["loc"][0] for error in errors}
        assert required_fields == {"user_id", "amount", "currency", "status"}


class TestCheckoutSessionCreate:
    """Test CheckoutSessionCreate model"""

    def test_checkout_session_create_minimal(self):
        """Test CheckoutSessionCreate with minimal required fields"""
        session = CheckoutSessionCreate(
            tier=TierEnum.pro,
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel",
        )

        assert session.tier == TierEnum.pro
        assert session.subscription_type == SubscriptionTypeEnum.monthly
        assert session.success_url == "https://example.com/success"
        assert session.cancel_url == "https://example.com/cancel"

    def test_checkout_session_create_full(self):
        """Test CheckoutSessionCreate with all fields"""
        session = CheckoutSessionCreate(
            tier=TierEnum.pro,
            subscription_type=SubscriptionTypeEnum.yearly,
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel",
        )

        assert session.tier == TierEnum.pro
        assert session.subscription_type == SubscriptionTypeEnum.yearly
        assert session.success_url == "https://example.com/success"
        assert session.cancel_url == "https://example.com/cancel"

    def test_checkout_session_create_validation_error(self):
        """Test CheckoutSessionCreate validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            CheckoutSessionCreate(tier=TierEnum.pro)

        errors = exc_info.value.errors()
        assert len(errors) == 2
        required_fields = {error["loc"][0] for error in errors}
        assert required_fields == {"success_url", "cancel_url"}


class TestCheckoutSessionResponse:
    """Test CheckoutSessionResponse model"""

    def test_checkout_session_response_creation(self):
        """Test basic CheckoutSessionResponse creation"""
        response = CheckoutSessionResponse(
            checkout_url="https://checkout.stripe.com/session-123",
            session_id="cs_test_123",
        )

        assert response.checkout_url == "https://checkout.stripe.com/session-123"
        assert response.session_id == "cs_test_123"

    def test_checkout_session_response_validation_error(self):
        """Test CheckoutSessionResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            CheckoutSessionResponse(checkout_url="https://example.com")

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("session_id",)
        assert errors[0]["type"] == "missing"


class TestBillingPortalResponse:
    """Test BillingPortalResponse model"""

    def test_billing_portal_response_creation(self):
        """Test basic BillingPortalResponse creation"""
        response = BillingPortalResponse(
            portal_url="https://billing.stripe.com/session-123"
        )

        assert response.portal_url == "https://billing.stripe.com/session-123"

    def test_billing_portal_response_validation_error(self):
        """Test BillingPortalResponse validation with missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            BillingPortalResponse()

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("portal_url",)
        assert errors[0]["type"] == "missing"
