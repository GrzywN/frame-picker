"""Tests for payment repository"""

import uuid
from datetime import datetime, timezone

import pytest

from api.app.database.models import Payment, Subscription, User
from api.app.repositories.payment_repository import PaymentRepository


class TestPaymentRepository:
    """Test PaymentRepository operations"""

    @pytest.fixture
    def payment_repo(self, db_session):
        """Create payment repository with test session"""
        return PaymentRepository(db_session)

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

    def test_create_payment(self, payment_repo, sample_user, sample_subscription):
        """Test payment creation"""
        payment = payment_repo.create_payment(
            user_id=str(sample_user.id),
            subscription_id=str(sample_subscription.id),
            amount=299,
            currency="USD",
            status="SUCCEEDED",
            stripe_payment_intent_id="pi_test_123",
            stripe_invoice_id="in_test_123",
            description="Pro subscription payment",
        )

        assert payment.id is not None
        assert payment.user_id == sample_user.id
        assert payment.subscription_id == sample_subscription.id
        assert payment.amount == 299
        assert payment.currency == "USD"
        assert payment.status == "SUCCEEDED"
        assert payment.stripe_payment_intent_id == "pi_test_123"
        assert payment.stripe_invoice_id == "in_test_123"
        assert payment.description == "Pro subscription payment"

    def test_create_payment_minimal(self, payment_repo, sample_user):
        """Test payment creation with minimal required fields"""
        payment = payment_repo.create_payment(
            user_id=str(sample_user.id),
            amount=199,
            currency="EUR",
            status="PENDING",
        )

        assert payment.id is not None
        assert payment.user_id == sample_user.id
        assert payment.subscription_id is None
        assert payment.amount == 199
        assert payment.currency == "EUR"
        assert payment.status == "PENDING"
        assert payment.stripe_payment_intent_id is None
        assert payment.description is None

    def test_get_by_user_id(self, payment_repo, sample_user, sample_subscription):
        """Test getting payments by user ID"""
        # Create multiple payments
        payment1 = payment_repo.create_payment(
            user_id=str(sample_user.id),
            amount=299,
            currency="USD",
            status="SUCCEEDED",
            description="Payment 1",
        )

        payment2 = payment_repo.create_payment(
            user_id=str(sample_user.id),
            amount=199,
            currency="USD",
            status="SUCCEEDED",
            description="Payment 2",
        )

        payments = payment_repo.get_by_user_id(str(sample_user.id))

        assert len(payments) == 2
        # Should be ordered by created_at desc (newest first)
        assert payments[0].description == "Payment 2"  # Created second, appears first
        assert payments[1].description == "Payment 1"

    def test_get_by_user_id_with_limit(self, payment_repo, sample_user, db_session):
        """Test getting payments by user ID with limit"""
        # Create multiple payments
        for i in range(5):
            payment = Payment(
                user_id=sample_user.id,
                amount=100 + i,
                currency="USD",
                status="SUCCEEDED",
                description=f"Payment {i + 1}",
            )
            db_session.add(payment)
        db_session.commit()

        # Get payments with limit
        payments = payment_repo.get_by_user_id(str(sample_user.id), limit=3)

        assert len(payments) == 3

    def test_get_by_user_id_no_payments(self, payment_repo):
        """Test getting payments by user ID when no payments exist"""
        fake_user_id = str(uuid.uuid4())
        payments = payment_repo.get_by_user_id(fake_user_id)

        assert len(payments) == 0

    def test_get_by_stripe_payment_intent_id_exists(self, payment_repo, sample_user):
        """Test getting payment by Stripe payment intent ID when payment exists"""
        intent_id = "pi_test_456"
        created_payment = payment_repo.create_payment(
            user_id=str(sample_user.id),
            amount=299,
            currency="USD",
            status="SUCCEEDED",
            stripe_payment_intent_id=intent_id,
        )

        found_payment = payment_repo.get_by_stripe_payment_intent_id(intent_id)

        assert found_payment is not None
        assert found_payment.id == created_payment.id
        assert found_payment.stripe_payment_intent_id == intent_id

    def test_get_by_stripe_payment_intent_id_not_exists(self, payment_repo):
        """Test getting payment by Stripe payment intent ID when payment doesn't exist"""
        found_payment = payment_repo.get_by_stripe_payment_intent_id("pi_nonexistent")

        assert found_payment is None

    def test_update_payment_status(self, payment_repo, sample_user):
        """Test updating payment status"""
        payment = payment_repo.create_payment(
            user_id=str(sample_user.id),
            amount=299,
            currency="USD",
            status="PENDING",
        )

        processed_at = datetime.now(timezone.utc)
        updated_payment = payment_repo.update_payment_status(
            payment,
            "SUCCEEDED",
            processed_at=processed_at,
        )

        assert updated_payment.status == "SUCCEEDED"
        assert updated_payment.processed_at == processed_at
        assert updated_payment.id == payment.id

    def test_update_payment_status_with_failure(self, payment_repo, sample_user):
        """Test updating payment status with failure reason"""
        payment = payment_repo.create_payment(
            user_id=str(sample_user.id),
            amount=299,
            currency="USD",
            status="PENDING",
        )

        failure_reason = "Insufficient funds"
        updated_payment = payment_repo.update_payment_status(
            payment,
            "FAILED",
            failure_reason=failure_reason,
        )

        assert updated_payment.status == "FAILED"
        assert updated_payment.failure_reason == failure_reason
        assert updated_payment.id == payment.id
