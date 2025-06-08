'use client'

import { useBilling } from '@/shared/hooks/use-billing'
import { useAuth } from '@/shared/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/molecules/card'
import { Badge } from '@/shared/ui/atoms/badge'
import { Button } from '@/shared/ui/atoms/button'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'
import { cn } from '@/shared/lib/utils'
import type { Payment } from '@/core/api/billing'

export interface PaymentHistoryProps {
  className?: string
  limit?: number
}

const PaymentHistory = ({ className, limit = 10 }: PaymentHistoryProps) => {
  const { user } = useAuth()
  const { payments, loading, error, refreshData } = useBilling()

  if (!user) {
    return null
  }

  const getStatusVariant = (status: Payment['status']): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'SUCCEEDED': return 'success'
      case 'PENDING': return 'warning'
      case 'FAILED': return 'error'
      case 'CANCELLED': return 'warning'
      case 'REFUNDED': return 'info'
      default: return 'info'
    }
  }

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'SUCCEEDED': return '✅'
      case 'PENDING': return '⏳'
      case 'FAILED': return '❌'
      case 'CANCELLED': return '🚫'
      case 'REFUNDED': return '💰'
      default: return '❓'
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    const formattedAmount = (amount / 100).toFixed(2)
    return `$${formattedAmount} ${currency.toUpperCase()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const displayedPayments = payments.slice(0, limit)

  if (loading && payments.length === 0) {
    return (
      <Card variant="processing" className={cn('relative overflow-hidden', className)}>
        <BlobDecoration size="lg" color="green" position="center" className="opacity-30" />
        <CardContent className="p-8 text-center relative z-10">
          <div className="w-8 h-8 border-3 border-energy-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-body">Loading payment history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {error && (
        <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
          <BlobDecoration size="md" color="gold" position="center" className="opacity-30" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="font-mono text-small text-void-black">{error}</span>
              <Button variant="ghost" size="sm" onClick={refreshData}>
                🔄 RETRY
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AnimatedBg variant="particles" intensity="low">
        <Card variant="default" hover className="relative overflow-hidden">
          <BlobDecoration size="xl" color="gradient" position="top-right" className="opacity-10" />
          <BlobDecoration size="lg" color="purple" position="bottom-left" className="opacity-15" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                💳 PAYMENT HISTORY
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={refreshData}
                loading={loading}
                disabled={loading}
              >
                🔄 REFRESH
              </Button>
            </div>
            <OrganicShape variant="lightning" size="sm" color="blue" className="top-0 right-0 opacity-20" />
          </CardHeader>

          <CardContent className="relative z-10">
            {displayedPayments.length === 0 ? (
              <div className="text-center py-12">
                <OrganicShape variant="squiggle" size="lg" color="purple" className="top-0 left-1/4 opacity-15" />
                <OrganicShape variant="blob2" size="md" color="gold" className="bottom-0 right-1/4 opacity-20" />
                
                <div className="text-6xl mb-4 relative z-10">💳</div>
                <h3 className="font-mono text-h3 font-bold text-void-black uppercase mb-2 relative z-10">
                  NO PAYMENT HISTORY
                </h3>
                <p className="font-mono text-body text-gray-700 relative z-10">
                  {user.tier === 'FREE' 
                    ? 'Upgrade to Pro to see your payment history'
                    : 'Your payments will appear here once processed'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedPayments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className={cn(
                      'p-4 border-2 border-gray-200 rounded-lg relative',
                      'hover:border-electric-blue transition-all duration-200'
                    )}
                  >
                    {index % 3 === 0 && (
                      <OrganicShape 
                        variant={index % 2 === 0 ? "blob3" : "lightning"} 
                        size="sm" 
                        color="blue" 
                        className="top-0 right-0 opacity-15" 
                      />
                    )}
                    
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getStatusIcon(payment.status)}</span>
                          <Badge variant={getStatusVariant(payment.status)} size="sm">
                            {payment.status}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-mono font-bold text-body">
                            {formatAmount(payment.amount, payment.currency)}
                          </h4>
                          <p className="font-mono text-small text-gray-700">
                            {payment.description || 'Subscription payment'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-mono text-small text-void-black font-bold">
                          {formatDate(payment.processed_at || payment.created_at!)}
                        </p>
                        <p className="font-mono text-caption text-gray-700">
                          ID: {payment.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {payments.length > limit && (
                  <div className="text-center pt-4 border-t-2 border-gray-200">
                    <p className="font-mono text-small text-gray-700 mb-3">
                      Showing {limit} of {payments.length} payments
                    </p>
                    <Button variant="secondary" size="sm">
                      📄 VIEW ALL PAYMENTS
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedBg>
    </div>
  )
}

export { PaymentHistory }
