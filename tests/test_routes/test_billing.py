"""Tests for billing routes"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from api.app.database.connection import get_db
from api.app.database.models import Subscription, User
from api.app.main import app
from api.app.utils.password import hash_password


def override_get_db(db_session):
    """Override get_db dependency for testing"""

    def _override():
        yield db_session

    return _override


class TestBillingRoutes:
    """Test billing routes"""

    @pytest.fixture
    def client_with_db(self, db_session):
        """Create test client with overridden database"""
        app.dependency_overrides[get_db] = override_get_db(db_session)
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    @pytest.fixture
    def sample_user_with_token(self, db_session):
        """Create sample user and return auth token"""
        password = "testpassword123"
        user = User(
            email="test@example.com",
            password_hash=hash_password(password),
            tier="FREE",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Create token
        from api.app.utils.jwt import create_access_token

        token = create_access_token(data={"sub": str(user.id)})

        return user, token

    @pytest.fixture
    def sample_subscription(self, db_session, sample_user_with_token):
        """Create sample subscription"""
        user, _ = sample_user_with_token
        subscription = Subscription(
            user_id=user.id,
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

    @patch("api.app.services.billing_service.BillingService.create_checkout_session")
    def test_create_checkout_session_success(
        self, mock_create_checkout, client_with_db, sample_user_with_token
    ):
        """Test successful checkout session creation"""
        user, token = sample_user_with_token

        # Mock the service method
        mock_create_checkout.return_value = {
            "checkout_url": "https://checkout.stripe.com/session",
            "session_id": "cs_test_123",
        }

        # Make request
        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "tier": "PRO",
            "subscription_type": "MONTHLY",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel",
        }

        response = client_with_db.post(
            "/api/billing/checkout", json=data, headers=headers
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["checkout_url"] == "https://checkout.stripe.com/session"
        assert response_data["session_id"] == "cs_test_123"

        # Verify service was called correctly
        mock_create_checkout.assert_called_once_with(
            user_id=str(user.id),
            tier="PRO",
            subscription_type="MONTHLY",
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel",
        )

    def test_create_checkout_session_unauthorized(self, client_with_db):
        """Test checkout session creation without authentication"""
        data = {
            "tier": "PRO",
            "subscription_type": "MONTHLY",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel",
        }

        response = client_with_db.post("/api/billing/checkout", json=data)

        assert response.status_code == 401

    @patch("api.app.services.billing_service.BillingService.create_checkout_session")
    def test_create_checkout_session_service_error(
        self, mock_create_checkout, client_with_db, sample_user_with_token
    ):
        """Test checkout session creation with service error"""
        user, token = sample_user_with_token

        # Mock service to raise an error
        mock_create_checkout.side_effect = ValueError("Stripe is not configured")

        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "tier": "PRO",
            "subscription_type": "MONTHLY",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel",
        }

        response = client_with_db.post(
            "/api/billing/checkout", json=data, headers=headers
        )

        assert response.status_code == 400
        assert "Stripe is not configured" in response.json()["detail"]

    @patch(
        "api.app.services.billing_service.BillingService.create_billing_portal_session"
    )
    def test_create_billing_portal_success(
        self,
        mock_create_portal,
        client_with_db,
        sample_user_with_token,
        sample_subscription,
    ):
        """Test successful billing portal creation"""
        user, token = sample_user_with_token

        # Mock the service method
        mock_create_portal.return_value = {
            "portal_url": "https://billing.stripe.com/session"
        }

        headers = {"Authorization": f"Bearer {token}"}
        params = {"return_url": "https://example.com/account"}

        response = client_with_db.post(
            "/api/billing/portal", params=params, headers=headers
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["portal_url"] == "https://billing.stripe.com/session"

        # Verify service was called correctly
        mock_create_portal.assert_called_once_with(
            user_id=str(user.id),
            return_url="https://example.com/account",
        )

    def test_get_user_subscription_success(
        self, client_with_db, sample_user_with_token, sample_subscription
    ):
        """Test getting user subscription successfully"""
        user, token = sample_user_with_token

        headers = {"Authorization": f"Bearer {token}"}
        response = client_with_db.get("/api/billing/subscription", headers=headers)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["id"] == str(sample_subscription.id)
        assert response_data["user_id"] == str(user.id)
        assert response_data["tier"] == "PRO"
        assert response_data["subscription_type"] == "MONTHLY"
        assert response_data["status"] == "ACTIVE"

    def test_get_user_subscription_not_found(
        self, client_with_db, sample_user_with_token
    ):
        """Test getting user subscription when none exists"""
        user, token = sample_user_with_token

        headers = {"Authorization": f"Bearer {token}"}
        response = client_with_db.get("/api/billing/subscription", headers=headers)

        assert response.status_code == 404
        assert "No active subscription found" in response.json()["detail"]

    @patch("api.app.services.billing_service.BillingService.cancel_subscription")
    def test_cancel_subscription_success(
        self, mock_cancel, client_with_db, sample_user_with_token, sample_subscription
    ):
        """Test successful subscription cancellation"""
        user, token = sample_user_with_token

        # Mock the service method
        mock_cancel.return_value = True

        headers = {"Authorization": f"Bearer {token}"}
        response = client_with_db.delete("/api/billing/subscription", headers=headers)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["message"] == "Subscription cancelled successfully"

        # Verify service was called correctly
        mock_cancel.assert_called_once_with(str(user.id))

    @patch("api.app.services.billing_service.BillingService.cancel_subscription")
    def test_cancel_subscription_service_error(
        self, mock_cancel, client_with_db, sample_user_with_token
    ):
        """Test subscription cancellation with service error"""
        user, token = sample_user_with_token

        # Mock service to raise an error
        mock_cancel.side_effect = ValueError("No active subscription found")

        headers = {"Authorization": f"Bearer {token}"}
        response = client_with_db.delete("/api/billing/subscription", headers=headers)

        assert response.status_code == 400
        assert "No active subscription found" in response.json()["detail"]

    def test_get_user_payments_success(
        self, client_with_db, sample_user_with_token, db_session
    ):
        """Test getting user payment history"""
        user, token = sample_user_with_token

        # Create test payments with explicit timestamps to control order
        import time
        from datetime import datetime, timezone

        from api.app.database.models import Payment

        base_time = datetime.now(timezone.utc)

        payment1 = Payment(
            user_id=user.id,
            amount=299,
            currency="USD",
            status="SUCCEEDED",
            description="Payment 1",
            created_at=base_time,
        )
        db_session.add(payment1)
        db_session.flush()  # Flush to get the ID but don't commit yet

        payment2 = Payment(
            user_id=user.id,
            amount=199,
            currency="USD",
            status="SUCCEEDED",
            description="Payment 2",
            created_at=base_time.replace(
                microsecond=base_time.microsecond + 1000
            ),  # Later timestamp
        )
        db_session.add(payment2)
        db_session.commit()

        headers = {"Authorization": f"Bearer {token}"}
        response = client_with_db.get("/api/billing/payments", headers=headers)

        assert response.status_code == 200
        response_data = response.json()
        assert len(response_data) == 2

        # Verify both payments are present
        payment_descriptions = [p["description"] for p in response_data]
        assert "Payment 1" in payment_descriptions
        assert "Payment 2" in payment_descriptions

        # Verify amounts are correct
        payment_amounts = [p["amount"] for p in response_data]
        assert 199 in payment_amounts
        assert 299 in payment_amounts

    def test_get_user_payments_with_limit(
        self, client_with_db, sample_user_with_token, db_session
    ):
        """Test getting user payment history with limit"""
        user, token = sample_user_with_token

        # Create multiple payments
        from api.app.database.models import Payment

        for i in range(5):
            payment = Payment(
                user_id=user.id,
                amount=100 + i,
                currency="USD",
                status="SUCCEEDED",
                description=f"Payment {i + 1}",
            )
            db_session.add(payment)
        db_session.commit()

        headers = {"Authorization": f"Bearer {token}"}
        response = client_with_db.get("/api/billing/payments?limit=3", headers=headers)

        assert response.status_code == 200
        response_data = response.json()
        assert len(response_data) == 3

    def test_stripe_webhook_success(self, client_with_db, db_session):
        """Test successful Stripe webhook processing"""
        pass

    def test_stripe_webhook_no_secret(self, client_with_db):
        """Test webhook processing without configured secret"""
        with patch("api.app.routes.billing.settings") as mock_settings:
            mock_settings.STRIPE_WEBHOOK_SECRET = None

            headers = {"stripe-signature": "test_signature"}
            payload = '{"type": "test.event"}'

            response = client_with_db.post(
                "/api/billing/webhook",
                content=payload,
                headers=headers,
            )

            assert response.status_code == 400
            assert "Webhook secret not configured" in response.json()["detail"]

    @patch("api.app.services.billing_service.stripe")
    def test_stripe_webhook_invalid_signature(self, mock_stripe, client_with_db):
        """Test webhook processing with invalid signature"""
        with patch("api.app.services.billing_service.settings") as mock_settings:
            mock_settings.STRIPE_WEBHOOK_SECRET = "whsec_test_secret"

            # Mock Stripe to raise signature verification error
            mock_stripe.error.SignatureVerificationError = Exception
            mock_stripe.Webhook.construct_event.side_effect = (
                mock_stripe.error.SignatureVerificationError()
            )

            headers = {"stripe-signature": "invalid_signature"}
            payload = '{"type": "test.event"}'

            response = client_with_db.post(
                "/api/billing/webhook",
                content=payload,
                headers=headers,
            )

            assert response.status_code == 400
            assert "Invalid signature" in response.json()["detail"]
