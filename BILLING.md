# Frame Picker - Billing System Documentation

## Overview

The billing system provides comprehensive subscription and payment management integrated with Stripe. It supports user subscriptions, payment processing, webhook handling, and usage tracking.

## Architecture

### Database Models

#### Subscription Model (`api/app/database/models/subscription.py`)
- **Purpose**: Manages user subscriptions
- **Key Fields**:
  - `user_id`: Links to User model
  - `tier`: Subscription tier (FREE, PRO)
  - `subscription_type`: Billing frequency (MONTHLY, YEARLY)
  - `status`: Current status (ACTIVE, CANCELLED, etc.)
  - `stripe_subscription_id`: Stripe integration ID
  - **Timestamps**: creation, cancellation, period dates

#### Payment Model (`api/app/database/models/payment.py`)
- **Purpose**: Records all payment transactions
- **Key Fields**:
  - `user_id`: Links to User model
  - `subscription_id`: Optional link to Subscription
  - `amount`: Payment amount in cents
  - `currency`: Payment currency (default USD)
  - `status`: Payment status (SUCCEEDED, FAILED, etc.)
  - `stripe_payment_intent_id`: Stripe integration ID

### Enums

#### TierEnum (`api/app/enums/tier.py`)
```python
class TierEnum(str, Enum):
    free = "FREE"
    pro = "PRO"
```

#### SubscriptionTypeEnum (`api/app/enums/subscription_type.py`)
```python
class SubscriptionTypeEnum(str, Enum):
    monthly = "MONTHLY"
    yearly = "YEARLY"
```

#### SubscriptionStatusEnum (`api/app/enums/subscription_status.py`)
```python
class SubscriptionStatusEnum(str, Enum):
    active = "ACTIVE"
    inactive = "INACTIVE"
    cancelled = "CANCELLED"
    past_due = "PAST_DUE"
    unpaid = "UNPAID"
```

#### PaymentStatusEnum (`api/app/enums/payment_status.py`)
```python
class PaymentStatusEnum(str, Enum):
    pending = "PENDING"
    succeeded = "SUCCEEDED"
    failed = "FAILED"
    cancelled = "CANCELLED"
    refunded = "REFUNDED"
```

### Repositories

#### SubscriptionRepository (`api/app/repositories/subscription_repository.py`)
- `get_by_user_id()`: Find active subscription for user
- `get_by_stripe_subscription_id()`: Find by Stripe ID
- `create_subscription()`: Create new subscription
- `update_subscription_status()`: Update status and dates

#### PaymentRepository (`api/app/repositories/payment_repository.py`)
- `get_by_user_id()`: Get payment history for user
- `get_by_stripe_payment_intent_id()`: Find by Stripe ID
- `create_payment()`: Record new payment
- `update_payment_status()`: Update payment status

### Services

#### BillingService (`api/app/services/billing_service.py`)
Main service handling all billing operations:

**Stripe Integration Methods:**
- `create_checkout_session()`: Create Stripe checkout for subscription
- `create_billing_portal_session()`: Create customer portal session
- `handle_webhook_event()`: Process Stripe webhooks

**Subscription Management:**
- `get_user_subscription()`: Get user's active subscription
- `cancel_subscription()`: Cancel user's subscription
- `get_user_payments()`: Get payment history

**Webhook Event Handlers:**
- `_handle_checkout_completed()`: Process successful checkouts
- `_handle_payment_succeeded()`: Record successful payments
- `_handle_payment_failed()`: Record failed payments
- `_handle_subscription_updated()`: Update subscription details
- `_handle_subscription_cancelled()`: Handle cancellations

### API Routes

#### Billing Routes (`api/app/routes/billing.py`)

**Authentication Required for all endpoints**

##### POST `/api/billing/checkout`
Create Stripe checkout session for subscription upgrade.

**Request Body:**
```json
{
  "tier": "PRO",
  "subscription_type": "MONTHLY",
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/session_...",
  "session_id": "cs_test_..."
}
```

##### POST `/api/billing/portal`
Create Stripe billing portal session for subscription management.

**Query Parameters:**
- `return_url`: URL to return to after portal session

**Response:**
```json
{
  "portal_url": "https://billing.stripe.com/session_..."
}
```

##### GET `/api/billing/subscription`
Get current user's subscription details.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid", 
  "tier": "PRO",
  "subscription_type": "MONTHLY",
  "status": "ACTIVE",
  "current_period_start": "2024-01-01T00:00:00Z",
  "current_period_end": "2024-02-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "cancelled_at": null
}
```

##### DELETE `/api/billing/subscription`
Cancel current user's subscription.

**Response:**
```json
{
  "message": "Subscription cancelled successfully"
}
```

##### GET `/api/billing/payments`
Get user's payment history.

**Query Parameters:**
- `limit`: Maximum number of payments to return (default: 50)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "subscription_id": "uuid",
    "amount": 299,
    "currency": "USD", 
    "status": "SUCCEEDED",
    "description": "Pro subscription payment",
    "created_at": "2024-01-01T00:00:00Z",
    "processed_at": "2024-01-01T00:00:01Z"
  }
]
```

##### POST `/api/billing/webhook`
Stripe webhook endpoint for processing events.

**Headers Required:**
- `stripe-signature`: Stripe webhook signature

**Supported Events:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key  
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_PRO_PRICE_ID=price_pro_monthly

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

### Stripe Configuration

1. **Create Products in Stripe Dashboard:**
   - Pro Monthly: $2.99/month
   - Pro Yearly: $29.99/year (when implemented)

2. **Configure Webhooks:**
   - Endpoint URL: `https://yourdomain.com/api/billing/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `invoice.payment_succeeded` 
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

3. **Customer Portal Configuration:**
   - Enable subscription cancellation
   - Enable payment method updates
   - Set return URL to your frontend

## Database Migration

Run the billing tables migration:

```bash
# Apply migration
poetry run yoyo apply

# Check migration status
poetry run yoyo list
```

The migration creates:
- `subscriptions` table with relationships
- `payments` table with Stripe integration
- Proper indexes for performance
- Cascade deletion rules
- Timestamp triggers

## Usage Flow

### 1. User Subscription Upgrade
```python
# Frontend creates checkout session
response = await fetch('/api/billing/checkout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tier: 'PRO',
    subscription_type: 'MONTHLY',
    success_url: 'https://app.com/success',
    cancel_url: 'https://app.com/cancel'
  })
});

const { checkout_url } = await response.json();
// Redirect to checkout_url
```

### 2. Webhook Processing
When user completes payment, Stripe sends webhook:
1. `checkout.session.completed` creates subscription
2. User tier updated to PRO
3. `invoice.payment_succeeded` records payment

### 3. Subscription Management
```python
# User can access billing portal
response = await fetch('/api/billing/portal?return_url=https://app.com/account', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

const { portal_url } = await response.json();
// Redirect to portal_url
```

## Testing

### Unit Tests
- `tests/enums/test_*.py`: Test all enums
- `tests/test_models/test_billing.py`: Test Pydantic schemas
- `tests/test_repositories/test_*_repository.py`: Test repository operations
- `tests/test_services/test_billing_service.py`: Test service logic

### Integration Tests
- `tests/test_integration/test_billing_integration.py`: End-to-end billing flows
- `tests/test_routes/test_billing.py`: API endpoint tests

### Running Tests
```bash
# Run all billing tests
poetry run pytest tests/ -k billing

# Run specific test file
poetry run pytest tests/test_services/test_billing_service.py -v

# Run with coverage
poetry run pytest tests/ --cov=api.app.services.billing_service
```

## Error Handling

### Common Errors

1. **Stripe Not Configured**
   - Check environment variables
   - Verify webhook secret

2. **Subscription Not Found**
   - User doesn't have active subscription
   - Subscription was cancelled/expired

3. **Webhook Verification Failed**
   - Invalid signature
   - Incorrect webhook secret

4. **Payment Processing Failed**
   - Insufficient funds
   - Invalid payment method
   - Stripe service issues

### Monitoring

Monitor these metrics:
- Successful subscription creations
- Failed payment attempts
- Webhook processing errors
- Subscription cancellation rates

## Security Considerations

1. **Webhook Verification**: Always verify Stripe signatures
2. **Authentication**: All billing endpoints require valid JWT
3. **Data Validation**: Validate all input using Pydantic models
4. **SQL Injection Prevention**: Use parameterized queries via SQLAlchemy
5. **PII Protection**: Store minimal customer data, rely on Stripe for sensitive info

## Deployment Checklist

- [ ] Configure Stripe environment variables
- [ ] Run database migrations
- [ ] Set up Stripe webhook endpoint
- [ ] Configure customer portal settings
- [ ] Test webhook delivery
- [ ] Verify checkout flow end-to-end
- [ ] Set up monitoring/alerting
- [ ] Document price IDs for different tiers

## Future Enhancements

1. **Multiple Tiers**: Add STARTER, ENTERPRISE tiers
2. **Annual Billing**: Implement yearly subscriptions with discounts
3. **Usage-Based Billing**: Track API usage for billing
4. **Proration**: Handle mid-cycle plan changes
5. **Invoicing**: Generate custom invoices
6. **Dunning Management**: Handle failed payment retries
7. **Analytics**: Subscription metrics and reporting