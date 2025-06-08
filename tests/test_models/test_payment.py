"""Tests for Payment database model"""

from datetime import datetime, timezone

import pytest

from api.app.database.models import Payment, Subscription, User


class TestPaymentModel:
    """Test Payment database model"""

    @pytest.fixture
    def sample_user(self, db_session):
        """Create sample user for testing"""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            tier="PRO",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def sample_subscription(self, db_session, sample_user):
        """Create sample subscription for testing"""
        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="ACTIVE",
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        return subscription

    def test_payment_creation_minimal(self, db_session, sample_user):
        """Test basic payment creation with minimal fields"""
        payment = Payment(
            user_id=sample_user.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
        )
        db_session.add(payment)
        db_session.commit()
        db_session.refresh(payment)

        assert payment.id is not None
        assert payment.user_id == sample_user.id
        assert payment.subscription_id is None
        assert payment.amount == 299
        assert payment.currency == "USD"
        assert payment.status == "SUCCEEDED"
        assert payment.created_at is not None

    def test_payment_creation_full(self, db_session, sample_user, sample_subscription):
        """Test payment creation with all fields"""
        processed_at = datetime.now(timezone.utc)

        payment = Payment(
            user_id=sample_user.id,
            subscription_id=sample_subscription.id,
            amount=199,
            currency="EUR",
            status="SUCCEEDED",
            stripe_payment_intent_id="pi_test_123",
            stripe_invoice_id="in_test_456",
            description="Pro subscription payment",
            processed_at=processed_at,
        )
        db_session.add(payment)
        db_session.commit()
        db_session.refresh(payment)

        assert payment.subscription_id == sample_subscription.id
        assert payment.stripe_payment_intent_id == "pi_test_123"
        assert payment.stripe_invoice_id == "in_test_456"
        assert payment.description == "Pro subscription payment"
        assert payment.processed_at == processed_at

    def test_payment_with_failure(self, db_session, sample_user):
        """Test payment with failure information"""
        payment = Payment(
            user_id=sample_user.id,
            amount=299,
            currency="USD",
            status="FAILED",
            failure_reason="Insufficient funds",
        )
        db_session.add(payment)
        db_session.commit()
        db_session.refresh(payment)

        assert payment.status == "FAILED"
        assert payment.failure_reason == "Insufficient funds"

    def test_payment_user_relationship(self, db_session, sample_user):
        """Test payment-user relationship"""
        payment = Payment(
            user_id=sample_user.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
        )
        db_session.add(payment)
        db_session.commit()
        db_session.refresh(payment)

        # Test relationship
        assert payment.user is not None
        assert payment.user.id == sample_user.id
        assert payment.user.email == sample_user.email

    def test_payment_subscription_relationship(
        self, db_session, sample_user, sample_subscription
    ):
        """Test payment-subscription relationship"""
        payment = Payment(
            user_id=sample_user.id,
            subscription_id=sample_subscription.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
        )
        db_session.add(payment)
        db_session.commit()
        db_session.refresh(payment)

        # Test relationship
        assert payment.subscription is not None
        assert payment.subscription.id == sample_subscription.id
        assert payment.subscription.tier == "PRO"

    def test_payment_unique_stripe_payment_intent_id(self, db_session, sample_user):
        """Test that stripe_payment_intent_id is unique"""
        payment1 = Payment(
            user_id=sample_user.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
            stripe_payment_intent_id="pi_unique_123",
        )
        db_session.add(payment1)
        db_session.commit()

        # Try to create another payment with the same stripe_payment_intent_id
        payment2 = Payment(
            user_id=sample_user.id,
            amount=199,
            currency="USD",
            status="SUCCEEDED",
            stripe_payment_intent_id="pi_unique_123",  # Same ID
        )
        db_session.add(payment2)

        with pytest.raises(Exception):  # Should raise integrity error
            db_session.commit()

    def test_payment_cascade_delete_with_user(self, db_session, sample_user):
        """Test that payment is deleted when user is deleted"""
        payment = Payment(
            user_id=sample_user.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
        )
        db_session.add(payment)
        db_session.commit()
        payment_id = payment.id

        # Delete user
        db_session.delete(sample_user)
        db_session.commit()

        # Check that payment was also deleted
        deleted_payment = (
            db_session.query(Payment).filter(Payment.id == payment_id).first()
        )
        assert deleted_payment is None

    def test_payment_cascade_delete_with_subscription(
        self, db_session, sample_user, sample_subscription
    ):
        """Test that payment is deleted when subscription is deleted"""
        payment = Payment(
            user_id=sample_user.id,
            subscription_id=sample_subscription.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
        )
        db_session.add(payment)
        db_session.commit()
        payment_id = payment.id

        # Delete subscription
        db_session.delete(sample_subscription)
        db_session.commit()

        # Check that payment was also deleted
        deleted_payment = (
            db_session.query(Payment).filter(Payment.id == payment_id).first()
        )
        assert deleted_payment is None

    def test_payment_default_currency(self, db_session, sample_user):
        """Test that payment currency defaults to USD"""
        payment = Payment(
            user_id=sample_user.id,
            amount=299,
            status="SUCCEEDED",
            # Not setting currency explicitly
        )
        db_session.add(payment)
        db_session.commit()
        db_session.refresh(payment)

        assert payment.currency == "USD"

    def test_payment_amount_in_cents(self, db_session, sample_user):
        """Test that payment amounts are stored in cents"""
        # $2.99 = 299 cents
        payment = Payment(
            user_id=sample_user.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
            description="$2.99 subscription",
        )
        db_session.add(payment)
        db_session.commit()
        db_session.refresh(payment)

        assert payment.amount == 299
        assert payment.description == "$2.99 subscription"
