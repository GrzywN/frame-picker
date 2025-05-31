"""
Billing and subscription endpoints
"""

from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..billing.plans import get_all_plans, get_plan
from ..billing.stripe_client import StripeWebhookHandler
from ..dependencies import get_db
from ..services.billing_service import BillingService

router = APIRouter(prefix="/billing", tags=["billing"])


class CheckoutRequest(BaseModel):
    email: str
    tier: str = "pro"


class BillingPortalRequest(BaseModel):
    email: str


@router.get("/plans")
async def get_billing_plans():
    """Get all available billing plans"""
    plans = get_all_plans()

    return {
        "plans": [
            {
                "tier": plan.tier.value,
                "name": plan.name,
                "price_cents": plan.price_cents,
                "price_dollars": plan.price_dollars,
                "description": plan.description,
                "features": plan.features,
                "limits": plan.limits,
                "is_free": plan.is_free,
            }
            for plan in plans
        ]
    }


@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest, db: Session = Depends(get_db)
):
    """Create Stripe checkout session"""
    try:
        billing_service = BillingService(db)

        # Get or create user
        user = billing_service.get_or_create_user(request.email)

        # Check if user already has active subscription
        existing_subscription = billing_service.get_user_subscription(user)
        if existing_subscription and existing_subscription.is_active:
            raise HTTPException(
                status_code=400, detail="User already has an active subscription"
            )

        # Create checkout session
        checkout_url = billing_service.create_checkout_session(user, request.tier)

        return {
            "checkout_url": checkout_url,
            "message": "Checkout session created successfully",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create checkout session: {str(e)}"
        )


@router.post("/portal")
async def create_billing_portal_session(
    request: BillingPortalRequest, db: Session = Depends(get_db)
):
    """Create Stripe billing portal session"""
    try:
        billing_service = BillingService(db)

        # Get user
        user = billing_service.get_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create portal session
        portal_url = billing_service.create_billing_portal_session(user)

        return {
            "portal_url": portal_url,
            "message": "Billing portal session created successfully",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create portal session: {str(e)}"
        )


@router.get("/status/{email}")
async def get_billing_status(email: str, db: Session = Depends(get_db)):
    """Get user's billing status and usage"""
    try:
        billing_service = BillingService(db)

        # Get user
        user = billing_service.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get subscription
        subscription = billing_service.get_user_subscription(user)

        # Get usage limits
        usage_check = billing_service.check_usage_limits(user)

        # Get plan details
        plan = get_plan(user.current_tier)

        return {
            "user": {
                "email": user.email,
                "current_tier": user.current_tier,
                "created_at": user.created_at.isoformat(),
            },
            "subscription": (
                {
                    "is_active": subscription.is_active if subscription else False,
                    "status": subscription.status if subscription else None,
                    "current_period_end": (
                        subscription.current_period_end.isoformat()
                        if subscription and subscription.current_period_end
                        else None
                    ),
                    "cancel_at_period_end": (
                        subscription.cancel_at_period_end if subscription else False
                    ),
                }
                if subscription
                else None
            ),
            "plan": {
                "name": plan.name,
                "price_dollars": plan.price_dollars,
                "features": plan.features,
                "limits": plan.limits,
            },
            "usage": usage_check["usage"],
            "within_limits": usage_check["within_limits"],
            "exceeded_limits": usage_check["exceeded"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get billing status: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    try:
        # Get raw body and signature
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        if not sig_header:
            raise HTTPException(
                status_code=400, detail="Missing stripe-signature header"
            )

        # Construct and verify webhook event
        event = StripeWebhookHandler.construct_webhook_event(payload, sig_header)

        billing_service = BillingService(db)

        # Handle different event types
        if event.type == "customer.subscription.created":
            subscription_data = (
                StripeWebhookHandler.handle_customer_subscription_created(event)
            )
            billing_service.handle_subscription_created(subscription_data)

        elif event.type == "customer.subscription.updated":
            subscription_data = (
                StripeWebhookHandler.handle_customer_subscription_updated(event)
            )
            billing_service.handle_subscription_updated(subscription_data)

        elif event.type == "customer.subscription.deleted":
            subscription_data = (
                StripeWebhookHandler.handle_customer_subscription_deleted(event)
            )
            billing_service.handle_subscription_deleted(subscription_data)

        elif event.type == "invoice.payment_succeeded":
            payment_data = StripeWebhookHandler.handle_invoice_payment_succeeded(event)
            billing_service.handle_payment_succeeded(payment_data)

        elif event.type == "invoice.payment_failed":
            payment_data = StripeWebhookHandler.handle_invoice_payment_failed(event)
            billing_service.handle_payment_failed(payment_data)

        else:
            print(f"Unhandled webhook event type: {event.type}")

        return JSONResponse(status_code=200, content={"status": "success"})

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.get("/usage/{email}")
async def get_usage_details(email: str, db: Session = Depends(get_db)):
    """Get detailed usage information for user"""
    try:
        billing_service = BillingService(db)

        # Get user
        user = billing_service.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get current usage
        usage = billing_service.get_current_usage(user)
        plan = get_plan(user.current_tier)

        # Calculate percentages
        usage_percentages = {}
        for limit_key, limit_value in plan.limits.items():
            if (
                limit_key in ["videos_per_month", "frames_per_video"]
                and limit_value != -1
            ):
                current_value = getattr(
                    usage, f"{limit_key.split('_')[0]}_processed", 0
                )
                usage_percentages[limit_key] = (
                    min((current_value / limit_value) * 100, 100)
                    if limit_value > 0
                    else 0
                )

        return {
            "current_usage": {
                "videos_processed": usage.videos_processed,
                "frames_extracted": usage.frames_extracted,
                "storage_used_mb": round(usage.storage_used_bytes / (1024 * 1024), 2),
                "api_requests": usage.api_requests,
            },
            "limits": plan.limits,
            "usage_percentages": usage_percentages,
            "month": usage.month.isoformat(),
            "next_reset": "2025-07-01",  # TODO: Calculate next month
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get usage details: {str(e)}"
        )
