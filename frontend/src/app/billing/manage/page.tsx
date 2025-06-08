'use client'

import { useEffect } from 'react'
import { useAuth } from '@/shared/hooks/use-auth'
import { useBilling } from '@/shared/hooks/use-billing'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

// Design System Components
import { Navbar } from '@/shared/ui/organisms/navbar'
import { SubscriptionManager } from '@/features/billing/components/subscription-manager'
import { PaymentHistory } from '@/features/billing/components/payment-history'
import { UpgradeButton } from '@/features/billing/components/upgrade-button'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/molecules/card'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'

export default function BillingManagePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { loading: billingLoading } = useBilling()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/billing/manage')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || billingLoading) {
    return (
      <AnimatedBg variant="blobs" intensity="low" className="min-h-screen flex items-center justify-center">
        <Card variant="processing" className="relative overflow-hidden">
          <BlobDecoration size="lg" color="green" position="center" className="opacity-30" />
          <CardContent className="p-8 text-center relative z-10">
            <div className="w-8 h-8 border-3 border-energy-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-body">Loading billing information...</p>
          </CardContent>
        </Card>
      </AnimatedBg>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <AnimatedBg variant="blobs" intensity="low" className="min-h-screen">
      {/* Navigation */}
      <Navbar user={user} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative">
        {/* Decorative Elements */}
        <BlobDecoration 
          size="xl" 
          color="gradient" 
          position="top-right" 
          className="opacity-5" 
        />
        
        <OrganicShape 
          variant="squiggle" 
          size="lg" 
          color="blue" 
          className="top-20 left-10 opacity-10" 
        />

        {/* Header */}
        <div className="mb-8 relative">
          <AnimatedBg variant="waves" intensity="medium">
            <Card variant="dark" className="bg-gradient-to-br from-void-black to-gray-900 relative overflow-hidden">
              <BlobDecoration size="xl" color="blue" position="top-left" className="opacity-20" />
              <BlobDecoration size="lg" color="green" position="bottom-right" className="opacity-15" />
              
              <CardContent className="p-8 relative z-10">
                <div className="text-center">
                  <OrganicShape variant="blob1" size="md" color="gold" className="top-0 right-1/4 opacity-20" />
                  
                  <h1 className="font-mono text-h1 font-bold text-electric-blue uppercase tracking-wide mb-4 relative z-10">
                    💳 BILLING & SUBSCRIPTIONS
                  </h1>
                  
                  <p className="font-mono text-body text-gray-200 relative z-10">
                    Manage your subscription, view payment history, and upgrade your plan
                  </p>
                  
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <span className="font-mono text-small text-gray-400">Account:</span>
                    <span className="font-mono text-small text-pure-white">{user.email}</span>
                    <span className="font-mono text-small text-saiyan-gold font-bold">
                      {user.tier} PLAN
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedBg>
        </div>

        {/* Content based on user tier */}
        {user.tier === 'PRO' ? (
          <div className="space-y-8">
            {/* Subscription Management */}
            <div className="relative">
              <OrganicShape 
                variant="blob2" 
                size="lg" 
                color="green" 
                className="top-0 left-0 opacity-5" 
              />
              <SubscriptionManager />
            </div>

            {/* Payment History */}
            <div className="relative">
              <OrganicShape 
                variant="lightning" 
                size="md" 
                color="purple" 
                className="top-0 right-0 opacity-10" 
              />
              <PaymentHistory limit={20} />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Free Plan Overview */}
            <AnimatedBg variant="particles" intensity="medium">
              <Card variant="default" className="bg-gray-100 border-electric-blue relative overflow-hidden">
                <BlobDecoration size="xl" color="blue" position="center" className="opacity-10" />
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-center flex items-center justify-center gap-3">
                    🆓 FREE PLAN
                  </CardTitle>
                  <OrganicShape variant="squiggle" size="md" color="blue" className="top-0 right-0 opacity-15" />
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="text-center space-y-6">
                    <p className="font-mono text-body text-gray-700">
                      You're currently on the Free plan. Upgrade to Pro for more features!
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Current Plan */}
                      <div className="relative">
                        <OrganicShape variant="blob1" size="md" color="blue" className="top-0 right-0 opacity-10" />
                        <h3 className="font-mono font-bold text-h3 uppercase mb-4 text-gray-700 relative z-10">
                          CURRENT: FREE
                        </h3>
                        <div className="space-y-2 font-mono text-small relative z-10">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm">✅</span>
                            <span>3 videos per month</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm">✅</span>
                            <span>720p quality</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm">⚠️</span>
                            <span>Watermarked results</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm">✅</span>
                            <span>Profile & Action modes</span>
                          </div>
                        </div>
                      </div>

                      {/* Pro Plan Preview */}
                      <div className="relative">
                        <OrganicShape variant="blob2" size="md" color="gold" className="top-0 left-0 opacity-15" />
                        <h3 className="font-mono font-bold text-h3 uppercase mb-4 text-saiyan-gold relative z-10">
                          UPGRADE: PRO
                        </h3>
                        <div className="space-y-2 font-mono text-small relative z-10">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm text-energy-green">🚀</span>
                            <span>100 videos per month</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm text-energy-green">🚀</span>
                            <span>1080p HD quality</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm text-energy-green">🚀</span>
                            <span>No watermarks</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm text-energy-green">🚀</span>
                            <span>Priority processing</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm text-energy-green">🚀</span>
                            <span>API access</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center text-sm text-energy-green">🚀</span>
                            <span>Priority support</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedBg>

            {/* Upgrade Buttons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="relative">
                <OrganicShape variant="lightning" size="lg" color="gold" className="top-0 right-0 opacity-10" />
                <UpgradeButton
                  variant="card"
                  subscriptionType="MONTHLY"
                  showFeatures={true}
                  className="h-full relative z-10"
                />
              </div>
              
              <div className="relative">
                <OrganicShape variant="blob3" size="lg" color="purple" className="top-0 left-0 opacity-10" />
                <UpgradeButton
                  variant="card"
                  subscriptionType="YEARLY"
                  showFeatures={true}
                  className="h-full relative z-10"
                />
              </div>
            </div>

            {/* Feature Comparison */}
            <AnimatedBg variant="grid" intensity="low">
              <Card variant="dark" hover className="relative overflow-hidden">
                <BlobDecoration size="xl" color="gradient" position="bottom-right" className="opacity-10" />
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-electric-blue text-center">
                    📊 PLAN COMPARISON
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="overflow-x-auto">
                    <table className="w-full font-mono text-small">
                      <thead>
                        <tr className="border-b-2 border-gray-700">
                          <th className="text-left py-3 text-gray-400">FEATURE</th>
                          <th className="text-center py-3 text-gray-400">FREE</th>
                          <th className="text-center py-3 text-saiyan-gold">PRO</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        {[
                          { feature: 'Videos per month', free: '3', pro: '100' },
                          { feature: 'Video quality', free: '720p', pro: '1080p HD' },
                          { feature: 'Watermarks', free: 'Yes', pro: 'None' },
                          { feature: 'Processing speed', free: 'Standard', pro: 'Priority' },
                          { feature: 'API access', free: 'No', pro: 'Yes' },
                          { feature: 'Support', free: 'Community', pro: 'Priority' },
                          { feature: 'Price', free: '$0/month', pro: '$2.99/month' },
                        ].map((row, index) => (
                          <tr key={index} className="border-b border-gray-800">
                            <td className="py-3 text-pure-white font-bold">{row.feature}</td>
                            <td className="py-3 text-center text-gray-400">{row.free}</td>
                            <td className="py-3 text-center text-energy-green font-bold">{row.pro}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </AnimatedBg>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center relative">
          <OrganicShape variant="squiggle" size="md" color="purple" className="top-0 left-1/4 opacity-10" />
          <p className="font-mono text-small text-gray-700">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@framepicker.ai" className="text-electric-blue hover:text-energy-green">
              support@framepicker.ai
            </a>
          </p>
        </div>

        {/* Floating decorative elements */}
        <OrganicShape variant="blob3" size="lg" color="green" className="bottom-20 right-10 opacity-5 animate-float" />
        <OrganicShape variant="lightning" size="md" color="gold" className="bottom-40 left-20 opacity-10 animate-float" />
      </main>
    </AnimatedBg>
  )
}
