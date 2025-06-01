'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useSubscription, useUsageStats } from '@/lib/supabase-hooks'

export default function BillingManager() {
  const { user, profile } = useAuth()
  const { subscription, loading: subLoading } = useSubscription()
  const { usage, loading: usageLoading } = useUsageStats()
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async () => {
    if (!user?.email) return

    setUpgrading(true)
    try {
      // TODO: Create Stripe checkout session
      // For now, just show placeholder
      alert('Stripe integration coming soon!')
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setUpgrading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user?.email) return

    try {
      // TODO: Create Stripe billing portal session
      alert('Billing portal coming soon!')
    } catch (error) {
      console.error('Failed to open billing portal:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }

  const planLimits = {
    free: {
      videos_per_month: 3,
      frames_per_video: 3,
      max_file_size: 50 * 1024 * 1024, // 50MB
      price: 0,
      features: [
        '3 videos per month',
        'Up to 3 frames per video',
        '720p resolution',
        '50MB file limit',
        'Basic processing'
      ]
    },
    pro: {
      videos_per_month: 100,
      frames_per_video: 10,
      max_file_size: 500 * 1024 * 1024, // 500MB
      price: 299, // $2.99
      features: [
        '100 videos per month',
        'Up to 10 frames per video',
        '1080p HD resolution',
        '500MB file limit',
        'No watermarks',
        'Priority processing',
        'API access',
        'Email support'
      ]
    }
  }

  const currentPlan = planLimits[profile?.current_tier as keyof typeof planLimits] || planLimits.free
  const isFreePlan = profile?.current_tier === 'free' || !profile?.current_tier

  return (
    <section>
      <h3>💳 Billing & Usage</h3>

      {/* Current Plan */}
      <article>
        <header>
          <h4>
            {isFreePlan ? '🆓 Free Plan' : '⭐ Pro Plan'}
            {!isFreePlan && (
              <span style={{ marginLeft: '1rem', fontSize: '1rem', fontWeight: 'normal' }}>
                ${(currentPlan.price / 100).toFixed(2)}/month
              </span>
            )}
          </h4>
        </header>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Plan Features */}
          <div>
            <h5>Features</h5>
            <ul>
              {currentPlan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          {/* Usage Stats */}
          <div>
            <h5>Current Usage</h5>
            {usageLoading ? (
              <div aria-busy="true">Loading usage...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Videos */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <span>Videos this month</span>
                    <span>{usage.videos_processed} / {currentPlan.videos_per_month}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--pico-color-grey-200)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${getUsagePercentage(usage.videos_processed, currentPlan.videos_per_month)}%`,
                      height: '100%',
                      backgroundColor: usage.videos_processed >= currentPlan.videos_per_month 
                        ? 'var(--pico-color-red-500)' 
                        : 'var(--pico-color-green-500)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Frames */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <span>Frames extracted</span>
                    <span>{usage.frames_extracted}</span>
                  </div>
                </div>

                {/* Storage */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <span>Storage used</span>
                    <span>{formatFileSize(usage.storage_used_bytes)}</span>
                  </div>
                </div>

                {/* API Requests */}
                {!isFreePlan && (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem'
                    }}>
                      <span>API requests</span>
                      <span>{usage.api_requests}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <footer>
          {isFreePlan ? (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              aria-busy={upgrading}
            >
              {upgrading ? 'Processing...' : 'Upgrade to Pro - $2.99/month'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleManageSubscription}
                className="outline"
              >
                Manage Subscription
              </button>
              {subLoading ? (
                <div aria-busy="true">Loading subscription...</div>
              ) : subscription ? (
                <small style={{ alignSelf: 'center', color: 'var(--pico-color-green-500)' }}>
                  ✅ Active subscription
                </small>
              ) : (
                <small style={{ alignSelf: 'center', color: 'var(--pico-color-orange-500)' }}>
                  ⚠️ Subscription inactive
                </small>
              )}
            </div>
          )}
        </footer>
      </article>

      {/* Plan Comparison */}
      {isFreePlan && (
        <article style={{ marginTop: '2rem' }}>
          <header>
            <h4>Compare Plans</h4>
          </header>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem'
          }}>
            {/* Free Plan */}
            <div style={{
              border: '2px solid var(--pico-color-grey-300)',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: 'var(--pico-color-grey-50)'
            }}>
              <h5>🆓 Free</h5>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
                $0<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span>
              </div>
              <ul style={{ marginBottom: '2rem' }}>
                {planLimits.free.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <button disabled className="outline">
                Current Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div style={{
              border: '2px solid var(--pico-color-azure-500)',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: 'var(--pico-color-azure-50)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--pico-color-azure-500)',
                color: 'white',
                padding: '0.25rem 1rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                RECOMMENDED
              </div>
              
              <h5>⭐ Pro</h5>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
                $2.99<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span>
              </div>
              <ul style={{ marginBottom: '2rem' }}>
                {planLimits.pro.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                aria-busy={upgrading}
              >
                {upgrading ? 'Processing...' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        </article>
      )}

      {/* Usage Reset Info */}
      <article style={{ marginTop: '2rem' }}>
        <header>
          <h5>📅 Usage Reset</h5>
        </header>
        <p>
          Your monthly usage limits reset on the 1st of each month.
          {' '}
          <strong>Next reset:</strong> {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
        </p>
        {usage.videos_processed >= currentPlan.videos_per_month && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--pico-color-orange-50)',
            border: '1px solid var(--pico-color-orange-200)',
            borderRadius: '4px',
            color: 'var(--pico-color-orange-700)'
          }}>
            <strong>⚠️ Monthly limit reached</strong>
            <p style={{ margin: '0.5rem 0 0 0' }}>
              You've reached your monthly video processing limit. 
              {isFreePlan ? ' Upgrade to Pro for more videos!' : ' Please wait for next month\'s reset.'}
            </p>
          </div>
        )}
      </article>
    </section>
  )
}
