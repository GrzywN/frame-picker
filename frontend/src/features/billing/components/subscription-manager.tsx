'use client'

import { useState } from 'react'
import { useBilling } from '@/shared/hooks/use-billing'
import { useAuth } from '@/shared/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/ui/molecules/card'
import { Button } from '@/shared/ui/atoms/button'
import { Badge } from '@/shared/ui/atoms/badge'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'
import { cn } from '@/shared/lib/utils'

export interface SubscriptionManagerProps {
  className?: string
}

const SubscriptionManager = ({ className }: SubscriptionManagerProps) => {
  const { user } = useAuth()
  const { 
    subscription, 
    loading, 
    error, 
    openBillingPortal, 
    cancelSubscription,
    hasActiveSubscription,
    isSubscriptionCancelled,
    isSubscriptionPastDue,
    getCurrentPeriodEnd,
    getDaysUntilRenewal 
  } = useBilling()
  
  const [actionLoading, setActionLoading] = useState(false)

  if (!user || user.tier !== 'PRO') {
    return null
  }

  if (loading && !subscription) {
    return (
      <Card variant="processing" className={cn('relative overflow-hidden', className)}>
        <BlobDecoration size="lg" color="blue" position="center" className="opacity-30" />
        <CardContent className="p-8 text-center relative z-10">
          <div className="w-8 h-8 border-3 border-energy-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-body">Loading subscription...</p>
        </CardContent>
      </Card>
    )
  }

  const handleManageBilling = async () => {
    try {
      setActionLoading(true)
      await openBillingPortal()
    } catch (error) {
      console.error('Failed to open billing portal:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.')) {
      return
    }

    try {
      setActionLoading(true)
      await cancelSubscription()
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusVariant = (): 'success' | 'warning' | 'error' | 'info' => {
    if (!subscription) return 'info'
    
    switch (subscription.status) {
      case 'ACTIVE': return 'success'
      case 'CANCELLED': return 'warning'
      case 'PAST_DUE': return 'error'
      default: return 'info'
    }
  }

  const getStatusIcon = () => {
    if (!subscription) return '❓'
    
    switch (subscription.status) {
      case 'ACTIVE': return '✅'
      case 'CANCELLED': return '⚠️'
      case 'PAST_DUE': return '❌'
      default: return '❓'
    }
  }

  const renewalDays = getDaysUntilRenewal()
  const periodEnd = getCurrentPeriodEnd()

  return (
    <div className={cn('space-y-6', className)}>
      {error && (
        <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
          <BlobDecoration size="md" color="gold" position="center" className="opacity-30" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="font-mono text-small text-void-black">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <AnimatedBg variant="waves" intensity="low">
        <Card variant="default" hover className="relative overflow-hidden">
          <BlobDecoration size="xl" color="gradient" position="top-right" className="opacity-10" />
          <BlobDecoration size="lg" color="green" position="bottom-left" className="opacity-15" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                👑 YOUR PRO SUBSCRIPTION
              </CardTitle>
              <Badge variant={getStatusVariant()} size="md">
                {getStatusIcon()} {subscription?.status || 'UNKNOWN'}
              </Badge>
            </div>
            <OrganicShape variant="lightning" size="sm" color="gold" className="top-0 right-0 opacity-20" />
          </CardHeader>

          <CardContent className="space-y-4 relative z-10">
            {subscription ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-small">
                <div className="relative">
                  <OrganicShape variant="blob1" size="sm" color="blue" className="top-0 right-0 opacity-10" />
                  <span className="text-gray-700 font-medium block mb-1">PLAN TYPE:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">PRO</Badge>
                    <span className="text-void-black font-bold">
                      {subscription.subscription_type}
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  <OrganicShape variant="blob2" size="sm" color="green" className="top-0 left-0 opacity-10" />
                  <span className="text-gray-700 font-medium block mb-1">STATUS:</span>
                  <span className={cn(
                    "font-bold uppercase",
                    subscription.status === 'ACTIVE' ? "text-energy-green" : 
                    subscription.status === 'CANCELLED' ? "text-warning-orange" : 
                    "text-warning-orange"
                  )}>
                    {subscription.status}
                  </span>
                </div>

                {periodEnd && (
                  <div className="relative">
                    <OrganicShape variant="squiggle" size="sm" color="purple" className="bottom-0 right-0 opacity-10" />
                    <span className="text-gray-700 font-medium block mb-1">
                      {isSubscriptionCancelled ? 'ACCESS UNTIL:' : 'RENEWS ON:'}
                    </span>
                    <span className="text-void-black font-bold">
                      {formatDate(subscription.current_period_end!)}
                    </span>
                  </div>
                )}

                {renewalDays !== null && hasActiveSubscription && (
                  <div className="relative">
                    <OrganicShape variant="lightning" size="sm" color="gold" className="bottom-0 left-0 opacity-10" />
                    <span className="text-gray-700 font-medium block mb-1">DAYS REMAINING:</span>
                    <span className="text-void-black font-bold">
                      {renewalDays} day{renewalDays !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="relative">
                  <OrganicShape variant="blob3" size="sm" color="blue" className="top-0 right-0 opacity-10" />
                  <span className="text-gray-700 font-medium block mb-1">PRICE:</span>
                  <span className="text-void-black font-bold">
                    {subscription.subscription_type === 'MONTHLY' ? '$2.99/month' : '$29.99/year'}
                  </span>
                </div>

                <div className="relative">
                  <OrganicShape variant="squiggle" size="sm" color="green" className="top-0 left-0 opacity-10" />
                  <span className="text-gray-700 font-medium block mb-1">MEMBER SINCE:</span>
                  <span className="text-void-black font-bold">
                    {subscription.created_at ? formatDate(subscription.created_at) : 'Unknown'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">❓</span>
                <p className="font-mono text-body text-gray-700 mb-4">
                  No subscription information available
                </p>
                <p className="font-mono text-small text-gray-700">
                  Contact support if you believe this is an error.
                </p>
              </div>
            )}

            {/* Warning for cancelled subscriptions */}
            {isSubscriptionCancelled && periodEnd && (
              <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
                <BlobDecoration size="md" color="gold" position="center" className="opacity-20" />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h4 className="font-mono font-bold text-warning-orange uppercase mb-2">
                        SUBSCRIPTION CANCELLED
                      </h4>
                      <p className="font-mono text-small text-void-black">
                        Your Pro features will remain active until {formatDate(subscription?.current_period_end!)}.
                        After that, your account will be downgraded to the Free plan.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Past due warning */}
            {isSubscriptionPastDue && (
              <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
                <BlobDecoration size="md" color="gold" position="center" className="opacity-20" />
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">❌</span>
                    <div>
                      <h4 className="font-mono font-bold text-warning-orange uppercase mb-2">
                        PAYMENT REQUIRED
                      </h4>
                      <p className="font-mono text-small text-void-black">
                        Your subscription payment failed. Please update your payment method to continue using Pro features.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>

          <CardFooter className="relative z-10">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="primary"
                size="md"
                onClick={handleManageBilling}
                loading={actionLoading}
                disabled={actionLoading || loading}
                className="flex-1"
              >
                💳 MANAGE BILLING
              </Button>
              
              {hasActiveSubscription && !isSubscriptionCancelled && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleCancelSubscription}
                  loading={actionLoading}
                  disabled={actionLoading || loading}
                  className="flex-1"
                >
                  ❌ CANCEL PLAN
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </AnimatedBg>

      {/* Pro Features Overview */}
      <Card variant="dark" hover className="relative overflow-hidden">
        <BlobDecoration size="lg" color="blue" position="top-left" className="opacity-20" />
        <BlobDecoration size="md" color="green" position="bottom-right" className="opacity-15" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-electric-blue flex items-center gap-3">
            ⭐ YOUR PRO FEATURES
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-small">
            {[
              { icon: '🎯', title: '100 Videos/Month', desc: 'Process up to 100 videos monthly' },
              { icon: '📺', title: '1080p HD Quality', desc: 'Full HD frame extraction' },
              { icon: '✨', title: 'No Watermarks', desc: 'Clean, professional results' },
              { icon: '⚡', title: 'Priority Processing', desc: 'Faster video analysis' },
              { icon: '🔌', title: 'API Access', desc: 'Integrate with your workflow' },
              { icon: '💬', title: 'Priority Support', desc: 'Get help when you need it' },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3 relative">
                {index % 2 === 0 && (
                  <OrganicShape 
                    variant={index % 4 === 0 ? "blob1" : "blob2"} 
                    size="sm" 
                    color="gold" 
                    className="top-0 right-0 opacity-10" 
                  />
                )}
                <span className="text-2xl">{feature.icon}</span>
                <div className="relative z-10">
                  <h4 className="font-bold text-pure-white uppercase mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-gray-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { SubscriptionManager }
