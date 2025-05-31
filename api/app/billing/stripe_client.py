"""
Stripe API client wrapper
"""

from typing import Dict, Optional

import stripe

from ..config import settings
from .plans import TierEnum, get_plan

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeClient:
    """Wrapper for Stripe API operations"""

    @staticmethod
    def create_customer(email: str, name: Optional[str] = None) -> stripe.Customer:
        """Create a new Stripe customer"""
        customer_data = {"email": email}
        if name:
            customer_data["name"] = name

        return stripe.Customer.create(**customer_data)

    @staticmethod
    def create_checkout_session(
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict] = None,
    ) -> stripe.checkout.Session:
        """Create a checkout session for subscription"""

        session_data = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            "mode": "subscription",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "allow_promotion_codes": True,
        }

        if metadata:
            session_data["metadata"] = metadata

        return stripe.checkout.Session.create(**session_data)

    @staticmethod
    def create_billing_portal_session(
        customer_id: str, return_url: str
    ) -> stripe.billing_portal.Session:
        """Create a billing portal session for customer self-service"""

        return stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )

    @staticmethod
    def get_subscription(subscription_id: str) -> stripe.Subscription:
        """Get subscription details from Stripe"""
        return stripe.Subscription.retrieve(subscription_id)

    @staticmethod
    def cancel_subscription(subscription_id: str) -> stripe.Subscription:
        """Cancel subscription immediately"""
        return stripe.Subscription.delete(subscription_id)

    @staticmethod
    def cancel_subscription_at_period_end(subscription_id: str) -> stripe.Subscription:
        """Cancel subscription at the end of current period"""
        return stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)

    @staticmethod
    def reactivate_subscription(subscription_id: str) -> stripe.Subscription:
        """Reactivate a subscription set to cancel"""
        return stripe.Subscription.modify(subscription_id, cancel_at_period_end=False)

    @staticmethod
    def get_customer(customer_id: str) -> stripe.Customer:
        """Get customer details from Stripe"""
        return stripe.Customer.retrieve(customer_id)

    @staticmethod
    def update_customer(customer_id: str, **kwargs) -> stripe.Customer:
        """Update customer details"""
        return stripe.Customer.modify(customer_id, **kwargs)

    @staticmethod
    def get_upcoming_invoice(customer_id: str) -> stripe.Invoice:
        """Get upcoming invoice for customer"""
        return stripe.Invoice.upcoming(customer=customer_id)

    @staticmethod
    def list_payment_methods(customer_id: str) -> stripe.ListObject:
        """List customer's payment methods"""
        return stripe.PaymentMethod.list(customer=customer_id, type="card")

    @staticmethod
    def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
        """Construct and verify webhook event"""
        try:
            return stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")

    @staticmethod
    def get_price_details(price_id: str) -> stripe.Price:
        """Get price details from Stripe"""
        return stripe.Price.retrieve(price_id)


class StripeWebhookHandler:
    """Handle Stripe webhook events"""

    @staticmethod
    def handle_customer_subscription_created(event: stripe.Event) -> Dict:
        """Handle subscription created event"""
        subscription = event.data.object
        return {
            "stripe_subscription_id": subscription.id,
            "stripe_customer_id": subscription.customer,
            "stripe_price_id": subscription.items.data[0].price.id,
            "status": subscription.status,
            "current_period_start": subscription.current_period_start,
            "current_period_end": subscription.current_period_end,
        }

    @staticmethod
    def handle_customer_subscription_updated(event: stripe.Event) -> Dict:
        """Handle subscription updated event"""
        subscription = event.data.object
        return {
            "stripe_subscription_id": subscription.id,
            "status": subscription.status,
            "current_period_start": subscription.current_period_start,
            "current_period_end": subscription.current_period_end,
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "canceled_at": subscription.canceled_at,
        }

    @staticmethod
    def handle_customer_subscription_deleted(event: stripe.Event) -> Dict:
        """Handle subscription deleted event"""
        subscription = event.data.object
        return {
            "stripe_subscription_id": subscription.id,
            "status": "canceled",
            "canceled_at": subscription.canceled_at or subscription.ended_at,
        }

    @staticmethod
    def handle_invoice_payment_succeeded(event: stripe.Event) -> Dict:
        """Handle successful payment event"""
        invoice = event.data.object
        return {
            "stripe_invoice_id": invoice.id,
            "stripe_customer_id": invoice.customer,
            "amount_cents": invoice.amount_paid,
            "currency": invoice.currency,
            "status": "paid",
            "paid_at": invoice.status_transitions.paid_at,
            "description": f"Subscription payment - {invoice.lines.data[0].description if invoice.lines.data else 'Frame Picker Pro'}",
        }

    @staticmethod
    def handle_invoice_payment_failed(event: stripe.Event) -> Dict:
        """Handle failed payment event"""
        invoice = event.data.object
        return {
            "stripe_invoice_id": invoice.id,
            "stripe_customer_id": invoice.customer,
            "amount_cents": invoice.amount_due,
            "currency": invoice.currency,
            "status": "failed",
            "description": f"Failed payment - {invoice.lines.data[0].description if invoice.lines.data else 'Frame Picker Pro'}",
        }
