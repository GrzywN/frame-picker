"""
SQLAlchemy models for billing and user management
"""

import uuid as uuid_pkg
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .connection import Base


class User(Base):
    """User model for authentication and billing"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    stripe_customer_id = Column(String(255), index=True, nullable=True)
    current_tier = Column(String(50), nullable=False, default="free")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    subscriptions = relationship(
        "Subscription", back_populates="user", cascade="all, delete-orphan"
    )
    usage_tracking = relationship(
        "UsageTracking", back_populates="user", cascade="all, delete-orphan"
    )
    payment_history = relationship(
        "PaymentHistory", back_populates="user", cascade="all, delete-orphan"
    )
    sessions = relationship("Session", back_populates="user")

    def __repr__(self):
        return f"<User(email='{self.email}', tier='{self.current_tier}')>"


class Subscription(Base):
    """Subscription model for tracking user subscriptions"""

    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    stripe_subscription_id = Column(String(255), unique=True, nullable=False)
    stripe_price_id = Column(String(255), nullable=False)
    tier = Column(String(50), nullable=False, index=True)
    status = Column(
        String(50), nullable=False, index=True
    )  # active, canceled, past_due, etc.
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="subscriptions")

    @property
    def is_active(self) -> bool:
        """Check if subscription is currently active"""
        return self.status == "active"

    @property
    def is_canceled(self) -> bool:
        """Check if subscription is canceled"""
        return self.status == "canceled" or self.cancel_at_period_end

    def __repr__(self):
        return f"<Subscription(user_id='{self.user_id}', tier='{self.tier}', status='{self.status}')>"


class UsageTracking(Base):
    """Usage tracking model for monitoring user consumption"""

    __tablename__ = "usage_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    month = Column(Date, nullable=False, index=True)  # YYYY-MM-01 format
    videos_processed = Column(Integer, default=0, nullable=False)
    frames_extracted = Column(Integer, default=0, nullable=False)
    storage_used_bytes = Column(BigInteger, default=0, nullable=False)
    api_requests = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="usage_tracking")

    # Unique constraint on user_id + month
    __table_args__ = {"extend_existing": True}

    @property
    def storage_used_mb(self) -> float:
        """Get storage used in megabytes"""
        return self.storage_used_bytes / (1024 * 1024)

    def __repr__(self):
        return f"<UsageTracking(user_id='{self.user_id}', month='{self.month}', videos={self.videos_processed})>"


class PaymentHistory(Base):
    """Payment history model for tracking invoices and payments"""

    __tablename__ = "payment_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    stripe_invoice_id = Column(String(255), nullable=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), default="usd", nullable=False)
    status = Column(String(50), nullable=False, index=True)  # paid, failed, pending
    payment_method = Column(String(50), nullable=True)  # card, bank_transfer, etc.
    description = Column(Text, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="payment_history")

    @property
    def amount_dollars(self) -> float:
        """Get amount in dollars"""
        return self.amount_cents / 100

    def __repr__(self):
        return f"<PaymentHistory(user_id='{self.user_id}', amount=${self.amount_dollars}, status='{self.status}')>"


# Update the existing Session model to include user relationship
from .models import Session

# Add user relationship to existing Session model
Session.user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
Session.user = relationship("User", back_populates="sessions")
