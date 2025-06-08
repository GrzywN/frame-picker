/**
 * Billing cancelled page - shown when user cancels Stripe checkout
 */
'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/use-auth'

// Design System Components
import { Navbar } from '@/shared/ui/organisms/navbar'
import { UpgradeButton } from '@/features/billing/components/upgrade-button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/ui/molecules/card'
import { Button } from '@/shared/ui/atoms/button'
import { Badge } from '@/shared/ui/atoms/badge'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'

export default function BillingCancelledPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleContinue = () => {
    router.push('/dashboard')
  }

  const handleTryAgain = () => {
    router.push('/billing/manage')
  }

  const handleContactSupport = () => {
    // TODO: Open support email in new tab
    window.open('mailto:support@framepicker.ai?subject=Upgrade%20Help', '_blank')
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
          color="purple" 
          className="top-20 left-10 opacity-15" 
        />

        <div className="space-y-8">
          {/* Cancelled Message */}
          <AnimatedBg variant="waves" intensity="medium" className="rounded-lg">
            <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
              <BlobDecoration size="xl" color="gold" position="center" className="opacity-20" />
              <BlobDecoration size="lg" color="purple" position="bottom-right" className="opacity-15" />
              
              <CardContent className="p-8 text-center relative z-10">
                <OrganicShape variant="lightning" size="lg" color="gold" className="top-0 right-1/4 opacity-25" />
                
                <div className="space-y-6 relative z-10">
                  <div className="text-8xl mb-4">😔</div>
                  
                  <h1 className="font-mono text-h1 font-bold text-warning-orange uppercase tracking-wide">
                    CHECKOUT CANCELLED
                  </h1>
                  
                  <div className="space-y-2">
                    <h2 className="font-mono text-h2 font-bold text-void-black uppercase">
                      NO WORRIES!
                    </h2>
                    <p className="font-mono text-body text-gray-700">
                      Your subscription was not charged. You can try again anytime.
                    </p>
                  </div>

                  {isAuthenticated && (
                    <div className="bg-gray-100 border-2 border-gray-300 p-4 rounded-lg">
                      <p className="font-mono text-caption text-gray-700 mb-1">
                        ACCOUNT:
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-small text-void-black">
                          {user?.email}
                        </span>
                        <Badge variant="info" size="sm">
                          {user?.tier || 'FREE'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedBg>

          {/* Why Upgrade */}
          <AnimatedBg variant="particles" intensity="low">
            <Card variant="default" hover className="relative overflow-hidden">
              <BlobDecoration size="xl" color="gradient" position="top-left" className="opacity-10" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-center">
                  🤔 STILL CONSIDERING PRO?
                </CardTitle>
                <OrganicShape variant="blob1" size="md" color="blue" className="top-0 right-0 opacity-15" />
              </CardHeader>
              
              <CardContent className="relative z-10">
                <div className="text-center space-y-6">
                  <p className="font-mono text-body text-gray-700">
                    Here's what you're missing out on with the Free plan:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Free Plan Limitations */}
                    <div className="relative">
                      <OrganicShape variant="blob2" size="md" color="purple" className="top-0 right-0 opacity-10" />
                      <h3 className="font-mono font-bold text-h3 uppercase mb-4 text-gray-700 relative z-10">
                        FREE PLAN LIMITS
                      </h3>
                      <div className="space-y-3 font-mono text-small relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center text-sm text-warning-orange">⚠️</span>
                          <span>Only 3 videos per month</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center text-sm text-warning-orange">⚠️</span>
                          <span>720p quality only</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center text-sm text-warning-orange">⚠️</span>
                          <span>Watermarked results</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center text-sm text-warning-orange">⚠️</span>
                          <span>Standard processing speed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center text-sm text-warning-orange">⚠️</span>
                          <span>No API access</span>
                        </div>
                      </div>
                    </div>

                    {/* Pro Plan Benefits */}
                    <div className="relative">
                      <OrganicShape variant="blob3" size="md" color="green" className="top-0 left-0 opacity-15" />
                      <h3 className="font-mono font-bold text-h3 uppercase mb-4 text-energy-green relative z-10">
                        PRO PLAN BENEFITS
                      </h3>
                      <div className="space-y-3 font-mono text-small relative z-10">
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
                          <span>Full API access</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-saiyan-gold/10 border-2 border-saiyan-gold p-6 rounded-lg">
                    <h4 className="font-mono font-bold text-h3 text-saiyan-gold uppercase mb-3">
                      💰 GREAT VALUE
                    </h4>
                    <p className="font-mono text-body text-void-black mb-2">
                      Just <strong>$2.99/month</strong> for Pro features
                    </p>
                    <p className="font-mono text-small text-gray-700">
                      That's less than a cup of coffee for professional-grade video frame extraction!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedBg>

          {/* Upgrade Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative">
              <OrganicShape variant="lightning" size="lg" color="gold" className="top-0 right-0 opacity-10" />
              <UpgradeButton
                variant="card"
                subscriptionType="MONTHLY"
                showFeatures={false}
                className="h-full relative z-10"
              />
            </div>
            
            <div className="relative">
              <OrganicShape variant="squiggle" size="lg" color="blue" className="top-0 left-0 opacity-10" />
              <UpgradeButton
                variant="card"
                subscriptionType="YEARLY"
                showFeatures={false}
                className="h-full relative z-10"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
              <OrganicShape variant="blob1" size="md" color="purple" className="top-0 left-1/4 opacity-10" />
              
              <Button
                variant="primary"
                size="lg"
                onClick={handleTryAgain}
                className="flex items-center gap-2 relative z-10"
              >
                🔄 TRY UPGRADE AGAIN
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={handleContinue}
                className="flex items-center gap-2 relative z-10"
              >
                🏠 BACK TO DASHBOARD
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                size="md"
                onClick={handleContactSupport}
                className="flex items-center gap-2 mx-auto"
              >
                💬 NEED HELP? CONTACT SUPPORT
              </Button>
            </div>
          </div>

          {/* FAQ / Common Concerns */}
          <Card variant="dark" className="relative overflow-hidden">
            <BlobDecoration size="xl" color="blue" position="bottom-left" className="opacity-15" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-electric-blue text-center">
                ❓ COMMON QUESTIONS
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-small">
                <div className="space-y-4">
                  <div className="relative">
                    <OrganicShape variant="blob2" size="sm" color="green" className="top-0 right-0 opacity-15" />
                    <h4 className="font-bold text-pure-white mb-2 relative z-10">
                      🔒 Is my payment secure?
                    </h4>
                    <p className="text-gray-400 relative z-10">
                      Yes! We use Stripe for secure payment processing. Your card details are never stored on our servers.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <OrganicShape variant="lightning" size="sm" color="blue" className="top-0 left-0 opacity-15" />
                    <h4 className="font-bold text-pure-white mb-2 relative z-10">
                      🔄 Can I cancel anytime?
                    </h4>
                    <p className="text-gray-400 relative z-10">
                      Absolutely! Cancel your subscription anytime from your billing dashboard.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <OrganicShape variant="squiggle" size="sm" color="gold" className="top-0 right-0 opacity-15" />
                    <h4 className="font-bold text-pure-white mb-2 relative z-10">
                      💰 Any hidden fees?
                    </h4>
                    <p className="text-gray-400 relative z-10">
                      Nope! The price you see is exactly what you pay. No setup fees, no hidden charges.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <OrganicShape variant="blob3" size="sm" color="purple" className="top-0 left-0 opacity-15" />
                    <h4 className="font-bold text-pure-white mb-2 relative z-10">
                      🎯 Money-back guarantee?
                    </h4>
                    <p className="text-gray-400 relative z-10">
                      We offer a 7-day satisfaction guarantee. Not happy? We'll refund your money.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Contact */}
          <Card variant="default" className="relative overflow-hidden">
            <BlobDecoration size="md" color="green" position="center" className="opacity-20" />
            
            <CardContent className="p-6 text-center relative z-10">
              <h3 className="font-mono font-bold text-h3 text-void-black uppercase mb-4">
                💬 STILL HAVE QUESTIONS?
              </h3>
              <p className="font-mono text-body text-gray-700 mb-4">
                Our support team is here to help you get the most out of Frame Picker
              </p>
              <div className="flex items-center justify-center gap-4 font-mono text-small">
                <a 
                  href="mailto:support@framepicker.ai" 
                  className="text-electric-blue hover:text-energy-green font-bold"
                >
                  📧 support@framepicker.ai
                </a>
                <span className="text-gray-700">•</span>
                <a 
                  href="#" 
                  className="text-electric-blue hover:text-energy-green font-bold"
                >
                  💬 Live Chat
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating decorative elements */}
        <OrganicShape variant="blob1" size="lg" color="gold" className="bottom-20 right-10 opacity-5 animate-float" />
        <OrganicShape variant="squiggle" size="md" color="green" className="bottom-40 left-20 opacity-10 animate-float" />
      </main>
    </AnimatedBg>
  )
}
