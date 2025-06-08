"""Subscription database model"""

import uuid as uuid_pkg

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..connection import Base


class Subscription(Base):
    """Subscription model for user billing"""

    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Stripe integration
    stripe_subscription_id = Column(String(255), unique=True, index=True)
    stripe_customer_id = Column(String(255), index=True)
    stripe_price_id = Column(String(255))

    # Subscription details
    tier = Column(String(50), nullable=False)  # FREE, PRO
    subscription_type = Column(String(50), nullable=False)  # MONTHLY, YEARLY
    status = Column(String(50), nullable=False)  # ACTIVE, INACTIVE, etc.

    # Timestamps
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    cancelled_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="subscriptions")
    payments = relationship(
        "Payment", back_populates="subscription", cascade="all, delete-orphan"
    )
