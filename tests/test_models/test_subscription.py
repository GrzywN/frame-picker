"""Tests for Subscription database model"""

from datetime import datetime, timezone

import pytest

from api.app.database.models import Subscription, User


class TestSubscriptionModel:
    """Test Subscription database model"""

    @pytest.fixture
    def sample_user(self, db_session):
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

    def test_subscription_creation(self, db_session, sample_user):
        """Test basic subscription creation"""
        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="ACTIVE",
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        assert subscription.id is not None
        assert subscription.user_id == sample_user.id
        assert subscription.tier == "PRO"
        assert subscription.subscription_type == "MONTHLY"
        assert subscription.status == "ACTIVE"
        assert subscription.created_at is not None

    def test_subscription_with_stripe_data(self, db_session, sample_user):
        """Test subscription creation with Stripe integration data"""
        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="YEARLY",
            status="ACTIVE",
            stripe_subscription_id="sub_test_123",
            stripe_customer_id="cus_test_456",
            stripe_price_id="price_test_789",
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        assert subscription.stripe_subscription_id == "sub_test_123"
        assert subscription.stripe_customer_id == "cus_test_456"
        assert subscription.stripe_price_id == "price_test_789"

    def test_subscription_with_periods(self, db_session, sample_user):
        """Test subscription with period dates"""
        start_date = datetime.now(timezone.utc)
        end_date = datetime(2024, 12, 31, tzinfo=timezone.utc)

        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="ACTIVE",
            current_period_start=start_date,
            current_period_end=end_date,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        assert subscription.current_period_start == start_date
        assert subscription.current_period_end == end_date

    def test_subscription_cancellation_fields(self, db_session, sample_user):
        """Test subscription with cancellation fields"""
        cancelled_at = datetime.now(timezone.utc)
        ended_at = datetime(2024, 6, 30, tzinfo=timezone.utc)

        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="CANCELLED",
            cancelled_at=cancelled_at,
            ended_at=ended_at,
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        assert subscription.status == "CANCELLED"
        assert subscription.cancelled_at == cancelled_at
        assert subscription.ended_at == ended_at

    def test_subscription_user_relationship(self, db_session, sample_user):
        """Test subscription-user relationship"""
        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="ACTIVE",
        )
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)

        # Test relationship
        assert subscription.user is not None
        assert subscription.user.id == sample_user.id
        assert subscription.user.email == sample_user.email

    def test_subscription_unique_stripe_subscription_id(self, db_session, sample_user):
        """Test that stripe_subscription_id is unique"""
        subscription1 = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="ACTIVE",
            stripe_subscription_id="sub_unique_123",
        )
        db_session.add(subscription1)
        db_session.commit()

        # Try to create another subscription with the same stripe_subscription_id
        subscription2 = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="YEARLY",
            status="ACTIVE",
            stripe_subscription_id="sub_unique_123",  # Same ID
        )
        db_session.add(subscription2)

        with pytest.raises(Exception):  # Should raise integrity error
            db_session.commit()

    def test_subscription_cascade_delete_with_user(self, db_session, sample_user):
        """Test that subscription is deleted when user is deleted"""
        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="ACTIVE",
        )
        db_session.add(subscription)
        db_session.commit()
        subscription_id = subscription.id

        # Delete user
        db_session.delete(sample_user)
        db_session.commit()

        # Check that subscription was also deleted
        deleted_subscription = (
            db_session.query(Subscription)
            .filter(Subscription.id == subscription_id)
            .first()
        )
        assert deleted_subscription is None
