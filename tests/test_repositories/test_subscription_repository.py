"""Tests for subscription repository"""

import uuid
from datetime import datetime, timezone

import pytest

from api.app.database.models import Subscription, User
from api.app.repositories.subscription_repository import SubscriptionRepository


class TestSubscriptionRepository:
    """Test SubscriptionRepository operations"""

    @pytest.fixture
    def subscription_repo(self, db_session):
        """Create subscription repository with test session"""
        return SubscriptionRepository(db_session)

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

    def test_create_subscription(self, subscription_repo, sample_user):
        """Test subscription creation"""
        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
            stripe_subscription_id="sub_test_123",
            stripe_customer_id="cus_test_123",
            stripe_price_id="price_test_123",
        )

        assert subscription.id is not None
        assert subscription.user_id == sample_user.id
        assert subscription.tier == "PRO"
        assert subscription.subscription_type == "MONTHLY"
        assert subscription.status == "ACTIVE"
        assert subscription.stripe_subscription_id == "sub_test_123"
        assert subscription.stripe_customer_id == "cus_test_123"
        assert subscription.stripe_price_id == "price_test_123"

    def test_get_by_user_id_exists(self, subscription_repo, sample_user):
        """Test getting subscription by user ID when subscription exists"""
        created_subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
        )

        found_subscription = subscription_repo.get_by_user_id(str(sample_user.id))

        assert found_subscription is not None
        assert found_subscription.id == created_subscription.id
        assert found_subscription.user_id == sample_user.id

    def test_get_by_user_id_not_exists(self, subscription_repo):
        """Test getting subscription by user ID when subscription doesn't exist"""
        fake_user_id = str(uuid.uuid4())
        found_subscription = subscription_repo.get_by_user_id(fake_user_id)

        assert found_subscription is None

    def test_get_by_user_id_inactive_subscription(
        self, subscription_repo, sample_user, db_session
    ):
        """Test getting subscription by user ID when subscription is inactive"""
        # Create inactive subscription
        subscription = Subscription(
            user_id=sample_user.id,
            tier="PRO",
            subscription_type="MONTHLY",
            status="CANCELLED",
        )
        db_session.add(subscription)
        db_session.commit()

        found_subscription = subscription_repo.get_by_user_id(str(sample_user.id))

        assert found_subscription is None  # Should not return inactive subscriptions

    def test_get_by_stripe_subscription_id_exists(self, subscription_repo, sample_user):
        """Test getting subscription by Stripe subscription ID when subscription exists"""
        stripe_id = "sub_test_456"
        created_subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
            stripe_subscription_id=stripe_id,
        )

        found_subscription = subscription_repo.get_by_stripe_subscription_id(stripe_id)

        assert found_subscription is not None
        assert found_subscription.id == created_subscription.id
        assert found_subscription.stripe_subscription_id == stripe_id

    def test_get_by_stripe_subscription_id_not_exists(self, subscription_repo):
        """Test getting subscription by Stripe subscription ID when subscription doesn't exist"""
        found_subscription = subscription_repo.get_by_stripe_subscription_id(
            "sub_nonexistent"
        )

        assert found_subscription is None

    def test_update_subscription_status(self, subscription_repo, sample_user):
        """Test updating subscription status"""
        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
        )

        cancelled_at = datetime.now(timezone.utc)
        updated_subscription = subscription_repo.update_subscription_status(
            subscription,
            "CANCELLED",
            cancelled_at=cancelled_at,
        )

        assert updated_subscription.status == "CANCELLED"
        assert updated_subscription.cancelled_at == cancelled_at
        assert updated_subscription.id == subscription.id

    def test_update_subscription_status_with_ended_at(
        self, subscription_repo, sample_user
    ):
        """Test updating subscription status with ended_at"""
        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="MONTHLY",
        )

        ended_at = datetime.now(timezone.utc)
        updated_subscription = subscription_repo.update_subscription_status(
            subscription,
            "CANCELLED",
            ended_at=ended_at,
        )

        assert updated_subscription.status == "CANCELLED"
        assert updated_subscription.ended_at == ended_at

    def test_create_subscription_with_periods(self, subscription_repo, sample_user):
        """Test creating subscription with period dates"""
        start_date = datetime.now(timezone.utc)
        end_date = datetime(2024, 12, 31, tzinfo=timezone.utc)

        subscription = subscription_repo.create_subscription(
            user_id=str(sample_user.id),
            tier="PRO",
            subscription_type="YEARLY",
            current_period_start=start_date,
            current_period_end=end_date,
        )

        assert subscription.current_period_start == start_date
        assert subscription.current_period_end == end_date
        assert subscription.subscription_type == "YEARLY"
