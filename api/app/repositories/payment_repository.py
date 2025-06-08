"""Payment repository"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session as DBSession

from ..database.models import Payment
from .base import BaseRepository


class PaymentRepository(BaseRepository[Payment]):
    """Repository for payment operations"""

    def __init__(self, db: DBSession):
        super().__init__(Payment, db)

    def get_by_user_id(self, user_id: str, limit: int = 50) -> List[Payment]:
        """Get payments by user ID"""
        return (
            self.db.query(Payment)
            .filter(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_by_stripe_payment_intent_id(
        self, stripe_payment_intent_id: str
    ) -> Optional[Payment]:
        """Get payment by Stripe payment intent ID"""
        return (
            self.db.query(Payment)
            .filter(Payment.stripe_payment_intent_id == stripe_payment_intent_id)
            .first()
        )

    def create_payment(
        self,
        user_id: str,
        amount: int,
        currency: str,
        status: str,
        subscription_id: str = None,
        stripe_payment_intent_id: str = None,
        stripe_invoice_id: str = None,
        description: str = None,
    ) -> Payment:
        """Create new payment"""
        return self.create(
            user_id=user_id,
            subscription_id=subscription_id,
            amount=amount,
            currency=currency,
            status=status,
            stripe_payment_intent_id=stripe_payment_intent_id,
            stripe_invoice_id=stripe_invoice_id,
            description=description,
        )

    def update_payment_status(
        self,
        payment: Payment,
        status: str,
        processed_at: datetime = None,
        failure_reason: str = None,
    ) -> Payment:
        """Update payment status"""
        update_data = {"status": status}

        if processed_at:
            update_data["processed_at"] = processed_at
        if failure_reason:
            update_data["failure_reason"] = failure_reason

        return self.update(payment, **update_data)
