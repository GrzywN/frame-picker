"""Payment database model"""

import uuid as uuid_pkg

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..connection import Base


class Payment(Base):
    """Payment model for billing transactions"""

    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subscription_id = Column(
        UUID(as_uuid=True),
        ForeignKey("subscriptions.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Stripe integration
    stripe_payment_intent_id = Column(String(255), unique=True, index=True)
    stripe_invoice_id = Column(String(255), index=True)

    # Payment details
    amount = Column(Integer, nullable=False)  # Amount in cents
    currency = Column(String(3), nullable=False, default="USD")
    status = Column(String(50), nullable=False)  # PENDING, SUCCEEDED, etc.

    # Additional info
    description = Column(Text)
    failure_reason = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")
