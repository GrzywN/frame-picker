'use client'

import { useState } from 'react'
import { useBilling } from '@/shared/hooks/use-billing'
import { useAuth } from '@/shared/hooks/use-auth'
import { Button } from '@/shared/ui/atoms/button'
import { Badge } from '@/shared/ui/atoms/badge'
import { Card, CardContent } from '@/shared/ui/molecules/card'
import { cn } from '@/shared/lib/utils'

export interface UpgradeButtonProps {
  variant?: 'button' | 'card' | 'banner'
  size?: 'sm' | 'md' | 'lg'
  subscriptionType?: 'MONTHLY' | 'YEARLY'
  showFeatures?: boolean
  className?: string
}

const UpgradeButton = ({ 
  variant = 'button',
  size = 'md',
  subscriptionType = 'MONTHLY',
  showFeatures = false,
  className 
}: UpgradeButtonProps) => {
  const { user, isAuthenticated } = useAuth()
  const { createCheckoutSession, loading, getSubscriptionPrice } = useBilling()
  const [upgrading, setUpgrading] = useState(false)

  // Don't show upgrade button for Pro users
  if (user?.tier === 'PRO') {
    return null
  }

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/auth/login?redirect=/billing/upgrade'
      return
    }

    try {
      setUpgrading(true)
      await createCheckoutSession('PRO', subscriptionType)
    } catch (error) {
      console.error('Upgrade failed:', error)
      // Error is handled by the hook
    } finally {
      setUpgrading(false)
    }
  }

  const price = getSubscriptionPrice(subscriptionType)
  const savings = subscriptionType === 'YEARLY' ? '17% off' : null

  if (variant === 'button') {
    return (
      <Button
        variant="primary"
        size={size}
        onClick={handleUpgrade}
        loading={upgrading || loading}
        disabled={upgrading || loading}
        className={cn(
          'bg-gradient-to-r from-saiyan-gold to-warning-orange text-void-black font-bold',
          className
        )}
      >
        ⬆️ UPGRADE TO PRO
      </Button>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        'bg-gradient-to-r from-saiyan-gold/20 to-warning-orange/20',
        'border-3 border-saiyan-gold p-4 rounded-lg',
        className
      )}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚡</span>
              <h3 className="font-mono font-bold text-h3 uppercase text-void-black">
                UNLOCK PRO FEATURES
              </h3>
              {savings && (
                <Badge variant="success" size="sm">
                  {savings}
                </Badge>
              )}
            </div>
            <p className="font-mono text-body text-void-black">
              100 videos/month • HD quality • No watermarks • Priority support
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-h3 font-bold text-void-black">
                {price}
                <span className="text-small text-gray-700">
                  /{subscriptionType === 'MONTHLY' ? 'month' : 'year'}
                </span>
              </div>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpgrade}
              loading={upgrading || loading}
              disabled={upgrading || loading}
              className="bg-gradient-to-r from-saiyan-gold to-warning-orange text-void-black font-bold"
            >
              🚀 UPGRADE NOW
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Card variant
  return (
    <Card variant="default" hover className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-saiyan-gold/10 to-warning-orange/10" />
      
      <CardContent className="p-6 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl">👑</span>
            <h3 className="font-mono font-bold text-h2 uppercase text-void-black">
              GO PRO
            </h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-h1 font-bold text-saiyan-gold">
                {price}
              </span>
              {savings && (
                <Badge variant="success" size="md">
                  {savings}
                </Badge>
              )}
            </div>
            <p className="font-mono text-caption text-gray-700">
              per {subscriptionType === 'MONTHLY' ? 'month' : 'year'}
            </p>
          </div>

          {showFeatures && (
            <div className="space-y-3 text-left">
              <h4 className="font-mono font-bold text-body uppercase text-center mb-3">
                ✨ WHAT YOU GET
              </h4>
              
              <div className="grid grid-cols-1 gap-2 font-mono text-small">
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">100</Badge>
                  <span>videos per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">HD</Badge>
                  <span>1080p quality frames</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">✨</Badge>
                  <span>No watermarks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">⚡</Badge>
                  <span>Priority processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">🎯</Badge>
                  <span>API access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">💬</Badge>
                  <span>Priority support</span>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleUpgrade}
            loading={upgrading || loading}
            disabled={upgrading || loading}
            className="w-full bg-gradient-to-r from-saiyan-gold to-warning-orange text-void-black font-bold"
          >
            {upgrading || loading ? 'PROCESSING...' : '🚀 UPGRADE TO PRO'}
          </Button>

          {!isAuthenticated && (
            <p className="font-mono text-caption text-gray-700">
              Login required for upgrade
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { UpgradeButton }
