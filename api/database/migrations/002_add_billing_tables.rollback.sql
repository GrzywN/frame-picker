-- Rollback billing tables

-- Drop triggers
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS set_payments_created_at ON payments;
DROP TRIGGER IF EXISTS set_subscriptions_created_at ON subscriptions;

-- Drop indexes
DROP INDEX IF EXISTS idx_payments_stripe_invoice_id;
DROP INDEX IF EXISTS idx_payments_stripe_payment_intent_id;
DROP INDEX IF EXISTS idx_payments_subscription_id;
DROP INDEX IF EXISTS idx_payments_user_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_subscriptions_user_id;

-- Drop tables in reverse order
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscriptions;