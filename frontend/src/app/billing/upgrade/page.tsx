/**
 * Billing upgrade page
 */
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/shared/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

// Design System Components
import { Navbar } from '@/shared/ui/organisms/navbar'
import { UpgradeButton } from '@/features/billing/components/upgrade-button'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/molecules/card'
import { Button } from '@/shared/ui/atoms/button'
import { Badge } from '@/shared/ui/atoms/badge'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'

export default function BillingUpgradePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/billing/upgrade')
    }
    
    // Redirect Pro users to billing management
    if (user?.tier === 'PRO') {
      router.push('/billing/manage')
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return (
      <AnimatedBg variant="blobs" intensity="low" className="min-h-screen flex items-center justify-center">
        <Card variant="processing" className="relative overflow-hidden">
          <BlobDecoration size="lg" color="green" position="center" className="opacity-30" />
          <CardContent className="p-8 text-center relative z-10">
            <div className="w-8 h-8 border-3 border-energy-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-body">Loading...</p>
          </CardContent>
        </Card>
      </AnimatedBg>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (user.tier === 'PRO') {
    return null // Will redirect to billing management
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
          color="gold" 
          className="top-20 left-10 opacity-15" 
        />

        {/* Header */}
        <div className="mb-8 relative">
          <AnimatedBg variant="waves" intensity="high">
            <Card variant="default" className="bg-gradient-to-br from-saiyan-gold/20 to-warning-orange/20 border-saiyan-gold relative overflow-hidden">
              <BlobDecoration size="xl" color="gold" position="center" className="opacity-20" />
              <BlobDecoration size="lg" color="purple" position="bottom-right" className="opacity-15" />
              
              <CardContent className="p-8 text-center relative z-10">
                <OrganicShape variant="lightning" size="xl" color="gold" className="top-0 left-1/4 opacity-30" />
                
                <div className="space-y-6 relative z-10">
                  <div className="text-8xl mb-4">👑</div>
                  
                  <h1 className="font-mono text-h1 font-bold text-saiyan-gold uppercase tracking-wide">
                    UPGRADE TO PRO
                  </h1>
                  
                  <div className="space-y-2">
                    <h2 className="font-mono text-h2 font-bold text-void-black uppercase">
                      UNLOCK YOUR CREATIVE POTENTIAL
                    </h2>
                    <p className="font-mono text-body text-gray-700 max-w-2xl mx-auto">
                      Join thousands of content creators who've upgraded to Pro for professional-grade video frame extraction
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <Badge variant="warning" size="md">CURRENTLY:</Badge>
                    <span className="font-mono text-body font-bold text-void-black">
                      {user.email} • FREE PLAN
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedBg>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="relative">
            <OrganicShape variant="blob1" size="lg" color="blue" className="top-0 right-0 opacity-10" />
            <UpgradeButton
              variant="card"
              subscriptionType="MONTHLY"
              showFeatures={true}
              className="h-full relative z-10"
            />
          </div>
          
          <div className="relative">
            <OrganicShape variant="blob2" size="lg" color="green" className="top-0 left-0 opacity-10" />
            <Card variant="default" className="bg-gradient-to-br from-deep-purple/20 to-saiyan-gold/20 border-deep-purple h-full relative overflow-hidden">
              <BlobDecoration size="xl" color="purple" position="center" className="opacity-15" />
              
              <CardContent className="p-6 text-center space-y-4 relative z-10">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl">🎯</span>
                  <h3 className="font-mono font-bold text-h2 uppercase text-void-black">
                    YEARLY
                  </h3>
                  <Badge variant="success" size="md">
                    SAVE 17%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-h1 font-bold text-deep-purple">
                      $29.99
                    </span>
                  </div>
                  <p className="font-mono text-caption text-gray-700">
                    per year • $2.50/month
                  </p>
                  <p className="font-mono text-small text-energy-green font-bold">
                    Save $6 compared to monthly!
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <h4 className="font-mono font-bold text-body uppercase text-center mb-3">
                    ✨ EVERYTHING IN PRO
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2 font-mono text-small">
                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="sm">1200</Badge>
                      <span>videos per year</span>
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

                <UpgradeButton
                  variant="button"
                  size="lg"
                  subscriptionType="YEARLY"
                  className="w-full bg-gradient-to-r from-deep-purple to-saiyan-gold text-pure-white font-bold"
                />

                <p className="font-mono text-caption text-gray-700">
                  Best value for serious creators
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Comparison */}
        <AnimatedBg variant="grid" intensity="low" className="mb-8">
          <Card variant="dark" hover className="relative overflow-hidden">
            <BlobDecoration size="xl" color="blue" position="top-left" className="opacity-15" />
            <BlobDecoration size="lg" color="green" position="bottom-right" className="opacity-10" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-electric-blue text-center">
                📊 DETAILED COMPARISON
              </CardTitle>
              <OrganicShape variant="squiggle" size="md" color="blue" className="top-0 right-0 opacity-20" />
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-small">
                  <thead>
                    <tr className="border-b-2 border-gray-700">
                      <th className="text-left py-4 text-gray-400 w-1/2">FEATURE</th>
                      <th className="text-center py-4 text-gray-400 w-1/4">FREE</th>
                      <th className="text-center py-4 text-saiyan-gold w-1/4">PRO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Videos per month', free: '3', pro: '100', highlight: true },
                      { feature: 'Video quality', free: '720p', pro: '1080p HD', highlight: true },
                      { feature: 'Watermarks', free: 'Yes', pro: 'None', highlight: true },
                      { feature: 'Max file size', free: '50MB', pro: '500MB' },
                      { feature: 'Processing speed', free: 'Standard', pro: 'Priority' },
                      { feature: 'Frames per video', free: '3', pro: '10' },
                      { feature: 'API access', free: 'No', pro: 'Full access', highlight: true },
                      { feature: 'Support', free: 'Community', pro: 'Priority email' },
                      { feature: 'Price', free: '$0/month', pro: '$2.99/month', highlight: true },
                    ].map((row, index) => (
                      <tr 
                        key={index} 
                        className={`border-b border-gray-800 ${row.highlight ? 'bg-gray-800/30' : ''}`}
                      >
                        <td className="py-4 text-pure-white font-bold">{row.feature}</td>
                        <td className="py-4 text-center text-gray-400">{row.free}</td>
                        <td className="py-4 text-center text-energy-green font-bold">{row.pro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </AnimatedBg>

        {/* Social Proof */}
        <AnimatedBg variant="particles" intensity="medium" className="mb-8">
          <Card variant="default" hover className="relative overflow-hidden">
            <BlobDecoration size="xl" color="gradient" position="center" className="opacity-10" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-center">
                🌟 LOVED BY CREATORS WORLDWIDE
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2 relative">
                  <OrganicShape variant="blob1" size="md" color="blue" className="top-0 right-0 opacity-15" />
                  <div className="text-4xl relative z-10">🎬</div>
                  <div className="font-mono text-h2 font-bold text-electric-blue relative z-10">50K+</div>
                  <p className="font-mono text-small text-gray-700 relative z-10">Content Creators</p>
                </div>
                
                <div className="space-y-2 relative">
                  <OrganicShape variant="lightning" size="md" color="green" className="top-0 left-0 opacity-15" />
                  <div className="text-4xl relative z-10">⚡</div>
                  <div className="font-mono text-h2 font-bold text-energy-green relative z-10">1M+</div>
                  <p className="font-mono text-small text-gray-700 relative z-10">Frames Extracted</p>
                </div>
                
                <div className="space-y-2 relative">
                  <OrganicShape variant="squiggle" size="md" color="gold" className="top-0 right-0 opacity-15" />
                  <div className="text-4xl relative z-10">🚀</div>
                  <div className="font-mono text-h2 font-bold text-saiyan-gold relative z-10">98%</div>
                  <p className="font-mono text-small text-gray-700 relative z-10">Satisfaction Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedBg>

        {/* FAQ */}
        <Card variant="default" hover className="mb-8 relative overflow-hidden">
          <BlobDecoration size="lg" color="purple" position="bottom-left" className="opacity-15" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-center">
              ❓ FREQUENTLY ASKED QUESTIONS
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-small">
              {[
                {
                  q: "Can I cancel anytime?",
                  a: "Yes! Cancel your subscription anytime with no cancellation fees. You'll keep Pro features until the end of your billing period."
                },
                {
                  q: "Do you offer refunds?",
                  a: "We offer a 7-day money-back guarantee. If you're not satisfied, contact us for a full refund."
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal through Stripe."
                },
                {
                  q: "Is my payment information secure?",
                  a: "Absolutely! We use Stripe for payment processing, which is PCI DSS Level 1 certified and trusted by millions."
                },
                {
                  q: "Can I upgrade or downgrade my plan?",
                  a: "Yes! You can change your plan anytime. Upgrades are prorated, and downgrades take effect at the next billing cycle."
                },
                {
                  q: "Do you offer team or enterprise plans?",
                  a: "Yes! Contact us at enterprise@framepicker.ai for custom pricing and features for teams and businesses."
                }
              ].map((faq, index) => (
                <div key={index} className="space-y-2 relative">
                  {index % 2 === 0 && (
                    <OrganicShape 
                      variant={index % 4 === 0 ? "blob2" : "blob3"} 
                      size="sm" 
                      color="blue" 
                      className="top-0 right-0 opacity-10" 
                    />
                  )}
                  <h4 className="font-bold text-void-black relative z-10">Q: {faq.q}</h4>
                  <p className="text-gray-700 relative z-10">A: {faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="text-center space-y-6 relative">
          <OrganicShape variant="blob1" size="xl" color="gold" className="top-0 left-1/4 opacity-10" />
          
          <h2 className="font-mono text-h2 font-bold text-void-black uppercase relative z-10">
            🚀 READY TO UPGRADE?
          </h2>
          
          <p className="font-mono text-body text-gray-700 max-w-2xl mx-auto relative z-10">
            Join thousands of creators who've already upgraded to Pro. Start creating professional content today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <UpgradeButton
              variant="button"
              size="lg"
              subscriptionType="MONTHLY"
              className="bg-gradient-to-r from-electric-blue to-energy-green"
            />
            
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/dashboard')}
            >
              🏠 BACK TO DASHBOARD
            </Button>
          </div>
        </div>

        {/* Floating decorative elements */}
        <OrganicShape variant="lightning" size="lg" color="purple" className="bottom-20 right-10 opacity-5 animate-float" />
        <OrganicShape variant="squiggle" size="md" color="green" className="bottom-40 left-20 opacity-10 animate-float" />
      </main>
    </AnimatedBg>
  )
}
