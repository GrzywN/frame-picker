"""Billing endpoints"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database.connection import get_db
from ..dependencies import get_current_user
from ..models import CurrentUser
from ..models.schemas.billing import (
    BillingPortalResponse,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    PaymentResponse,
    SubscriptionResponse,
)
from ..services.billing_service import BillingService

router = APIRouter(prefix="/billing", tags=["billing"])


def get_billing_service(db: Session = Depends(get_db)) -> BillingService:
    """Dependency for BillingService"""
    return BillingService(db)


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    billing_service: BillingService = Depends(get_billing_service),
):
    """Create Stripe checkout session for subscription"""
    try:
        result = await billing_service.create_checkout_session(
            user_id=current_user.id,
            tier=request.tier.value,
            subscription_type=request.subscription_type.value,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )

        return CheckoutSessionResponse(
            checkout_url=result["checkout_url"],
            session_id=result["session_id"],
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create checkout session: {str(e)}"
        )


@router.post("/portal", response_model=BillingPortalResponse)
async def create_billing_portal_session(
    return_url: str,
    current_user: CurrentUser = Depends(get_current_user),
    billing_service: BillingService = Depends(get_billing_service),
):
    """Create Stripe billing portal session"""
    try:
        result = await billing_service.create_billing_portal_session(
            user_id=current_user.id,
            return_url=return_url,
        )

        return BillingPortalResponse(portal_url=result["portal_url"])

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create portal session: {str(e)}"
        )


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_user_subscription(
    current_user: CurrentUser = Depends(get_current_user),
    billing_service: BillingService = Depends(get_billing_service),
):
    """Get current user's subscription"""
    subscription = await billing_service.get_user_subscription(current_user.id)

    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")

    return SubscriptionResponse(
        id=str(subscription.id),
        user_id=str(subscription.user_id),
        tier=subscription.tier,
        subscription_type=subscription.subscription_type,
        status=subscription.status,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        created_at=subscription.created_at,
        cancelled_at=subscription.cancelled_at,
    )


@router.delete("/subscription")
async def cancel_subscription(
    current_user: CurrentUser = Depends(get_current_user),
    billing_service: BillingService = Depends(get_billing_service),
):
    """Cancel current user's subscription"""
    try:
        success = await billing_service.cancel_subscription(current_user.id)

        if success:
            return {"message": "Subscription cancelled successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to cancel subscription: {str(e)}"
        )


@router.get("/payments", response_model=List[PaymentResponse])
async def get_user_payments(
    limit: int = 50,
    current_user: CurrentUser = Depends(get_current_user),
    billing_service: BillingService = Depends(get_billing_service),
):
    """Get current user's payment history"""
    payments = await billing_service.get_user_payments(current_user.id, limit)

    return [
        PaymentResponse(
            id=str(payment.id),
            user_id=str(payment.user_id),
            subscription_id=(
                str(payment.subscription_id) if payment.subscription_id else None
            ),
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status,
            description=payment.description,
            created_at=payment.created_at,
            processed_at=payment.processed_at,
        )
        for payment in payments
    ]


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    billing_service: BillingService = Depends(get_billing_service),
):
    """Handle Stripe webhook events"""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Webhook secret not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        import stripe

        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        await billing_service.handle_webhook_event(event)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Webhook processing failed: {str(e)}"
        )
