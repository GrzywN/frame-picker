'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/use-auth'
import { useBilling } from '@/shared/hooks/use-billing'

// Design System Components
import { Navbar } from '@/shared/ui/organisms/navbar'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/ui/molecules/card'
import { Button } from '@/shared/ui/atoms/button'
import { Badge } from '@/shared/ui/atoms/badge'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'

export default function BillingSuccessPage() {
  const { user, isAuthenticated } = useAuth()
  const { refreshData, subscription } = useBilling()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Refresh billing data after successful payment
    const refreshBillingData = async () => {
      if (isAuthenticated) {
        await refreshData()
      }
      setIsLoading(false)
    }

    // Add a small delay to ensure Stripe webhook has processed
    const timeout = setTimeout(refreshBillingData, 2000)
    
    return () => clearTimeout(timeout)
  }, [isAuthenticated, refreshData])

  const handleContinue = () => {
    router.push('/dashboard')
  }

  const handleManageBilling = () => {
    router.push('/billing/manage')
  }

  if (!isAuthenticated) {
    return (
      <AnimatedBg variant="blobs" intensity="low" className="min-h-screen flex items-center justify-center">
        <Card variant="default" className="relative overflow-hidden">
          <BlobDecoration size="lg" color="blue" position="center" className="opacity-30" />
          <CardContent className="p-8 text-center relative z-10">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="font-mono text-h2 font-bold text-void-black uppercase mb-4">
              LOGIN REQUIRED
            </h2>
            <p className="font-mono text-body text-gray-700 mb-6">
              Please log in to view your subscription status
            </p>
            <Button variant="primary" size="lg" onClick={() => router.push('/auth/login')}>
              🚀 LOGIN
            </Button>
          </CardContent>
        </Card>
      </AnimatedBg>
    )
  }

  return (
    <AnimatedBg variant="blobs" intensity="low" className="min-h-screen">
      {/* Navigation */}
      <Navbar user={user} onSignOut={() => {}} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 relative">
        {/* Decorative Elements */}
        <BlobDecoration 
          size="xl" 
          color="gradient" 
          position="top-right" 
          className="opacity-10" 
        />
        
        <OrganicShape 
          variant="squiggle" 
          size="lg" 
          color="green" 
          className="top-20 left-10 opacity-15" 
        />

        <div className="space-y-8">
          {/* Success Message */}
          <AnimatedBg variant="waves" intensity="high" className="rounded-lg">
            <Card variant="default" className="bg-energy-green/10 border-energy-green relative overflow-hidden">
              <BlobDecoration size="xl" color="green" position="center" className="opacity-20" />
              <BlobDecoration size="lg" color="gold" position="top-right" className="opacity-15" />
              
              <CardContent className="p-8 text-center relative z-10">
                <OrganicShape variant="lightning" size="lg" color="gold" className="top-0 left-1/4 opacity-30" />
                
                <div className="space-y-6 relative z-10">
                  <div className="text-8xl mb-4 animate-bounce">🎉</div>
                  
                  <h1 className="font-mono text-h1 font-bold text-energy-green uppercase tracking-wide">
                    SUCCESS!
                  </h1>
                  
                  <div className="space-y-2">
                    <h2 className="font-mono text-h2 font-bold text-void-black uppercase">
                      WELCOME TO PRO!
                    </h2>
                    <p className="font-mono text-body text-gray-700">
                      Your subscription has been activated successfully
                    </p>
                  </div>

                  {sessionId && (
                    <div className="bg-gray-100 border-2 border-gray-300 p-4 rounded-lg">
                      <p className="font-mono text-caption text-gray-700 mb-1">
                        CHECKOUT SESSION:
                      </p>
                      <code className="font-mono text-small text-void-black">
                        {sessionId}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedBg>

          {/* Subscription Details */}
          {isLoading ? (
            <Card variant="processing" className="relative overflow-hidden">
              <BlobDecoration size="lg" color="blue" position="center" className="opacity-30" />
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-8 h-8 border-3 border-energy-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-mono text-body">Loading your subscription details...</p>
              </CardContent>
            </Card>
          ) : subscription ? (
            <AnimatedBg variant="particles" intensity="medium">
              <Card variant="dark" className="relative overflow-hidden">
                <BlobDecoration size="xl" color="blue" position="top-left" className="opacity-20" />
                <BlobDecoration size="lg" color="purple" position="bottom-right" className="opacity-15" />
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-electric-blue flex items-center gap-3">
                    👑 YOUR PRO SUBSCRIPTION
                  </CardTitle>
                  <OrganicShape variant="blob1" size="md" color="gold" className="top-0 right-0 opacity-20" />
                </CardHeader>
                
                <CardContent className="space-y-4 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-small">
                    <div className="relative">
                      <OrganicShape variant="blob2" size="sm" color="green" className="top-0 right-0 opacity-15" />
                      <span className="text-gray-400 font-medium block mb-1">PLAN:</span>
                      <div className="flex items-center gap-2 relative z-10">
                        <Badge variant="success" size="md">PRO</Badge>
                        <span className="text-pure-white font-bold">
                          {subscription.subscription_type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <OrganicShape variant="lightning" size="sm" color="blue" className="top-0 left-0 opacity-15" />
                      <span className="text-gray-400 font-medium block mb-1">STATUS:</span>
                      <Badge variant="success" size="md" className="relative z-10">
                        ✅ {subscription.status}
                      </Badge>
                    </div>
                    
                    <div className="relative">
                      <OrganicShape variant="squiggle" size="sm" color="purple" className="bottom-0 right-0 opacity-15" />
                      <span className="text-gray-400 font-medium block mb-1">NEXT BILLING:</span>
                      <span className="text-pure-white font-bold relative z-10">
                        {subscription.current_period_end 
                          ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    
                    <div className="relative">
                      <OrganicShape variant="blob3" size="sm" color="gold" className="bottom-0 left-0 opacity-15" />
                      <span className="text-gray-400 font-medium block mb-1">PRICE:</span>
                      <span className="text-saiyan-gold font-bold relative z-10">
                        {subscription.subscription_type === 'MONTHLY' ? '$2.99/month' : '$29.99/year'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedBg>
          ) : (
            <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
              <BlobDecoration size="md" color="gold" position="center" className="opacity-30" />
              <CardContent className="p-6 text-center relative z-10">
                <span className="text-4xl mb-4 block">⏳</span>
                <h3 className="font-mono font-bold text-h3 text-void-black uppercase mb-2">
                  PROCESSING SUBSCRIPTION
                </h3>
                <p className="font-mono text-body text-void-black">
                  Your payment was successful! Your subscription is being activated and should be ready shortly.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pro Features */}
          <Card variant="default" hover className="relative overflow-hidden">
            <BlobDecoration size="xl" color="gradient" position="bottom-left" className="opacity-10" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-center">
                ⭐ YOU NOW HAVE ACCESS TO
              </CardTitle>
              <OrganicShape variant="squiggle" size="md" color="green" className="top-0 right-0 opacity-20" />
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: '🎯', title: '100 Videos/Month', desc: 'Process up to 100 videos monthly' },
                  { icon: '📺', title: '1080p HD Quality', desc: 'Full HD frame extraction' },
                  { icon: '✨', title: 'No Watermarks', desc: 'Clean, professional results' },
                  { icon: '⚡', title: 'Priority Processing', desc: 'Faster video analysis' },
                  { icon: '🔌', title: 'API Access', desc: 'Integrate with your workflow' },
                  { icon: '💬', title: 'Priority Support', desc: 'Get help when you need it' },
                ].map((feature, index) => (
                  <div key={index} className="text-center space-y-2 relative">
                    {index % 2 === 0 && (
                      <OrganicShape 
                        variant={index % 3 === 0 ? "blob1" : "blob2"} 
                        size="sm" 
                        color="blue" 
                        className="top-0 right-0 opacity-15" 
                      />
                    )}
                    <div className="text-4xl relative z-10">{feature.icon}</div>
                    <h4 className="font-mono font-bold text-body uppercase relative z-10">
                      {feature.title}
                    </h4>
                    <p className="font-mono text-small text-gray-700 relative z-10">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
            <OrganicShape variant="blob3" size="lg" color="purple" className="top-0 left-0 opacity-10" />
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinue}
              className="flex items-center gap-2 relative z-10"
            >
              🚀 START CREATING
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={handleManageBilling}
              className="flex items-center gap-2 relative z-10"
            >
              💳 MANAGE BILLING
            </Button>
          </div>

          {/* Support Info */}
          <Card variant="dark" className="relative overflow-hidden">
            <BlobDecoration size="md" color="green" position="center" className="opacity-20" />
            
            <CardContent className="p-6 text-center relative z-10">
              <h3 className="font-mono font-bold text-h3 text-electric-blue uppercase mb-4">
                🎉 THANK YOU FOR UPGRADING!
              </h3>
              <p className="font-mono text-body text-gray-200 mb-4">
                Questions about your subscription? Need help getting started?
              </p>
              <p className="font-mono text-small text-gray-400">
                Contact us at{' '}
                <a 
                  href="mailto:support@framepicker.ai" 
                  className="text-electric-blue hover:text-energy-green"
                >
                  support@framepicker.ai
                </a>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Floating decorative elements */}
        <OrganicShape variant="lightning" size="md" color="gold" className="bottom-20 right-10 opacity-10 animate-float" />
      </main>
    </AnimatedBg>
  )
}
