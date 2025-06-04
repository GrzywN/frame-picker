'use client'

import { useAuth } from '@/shared/hooks/use-auth'
import { useUsageStats } from '@/shared/hooks/use-usage-stats'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Design System Components
import { Navbar } from '@/shared/ui/organisms/navbar'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/ui/molecules/card'
import { Button } from '@/shared/ui/atoms/button'
import { Badge } from '@/shared/ui/atoms/badge'
import { Progress } from '@/shared/ui/atoms/progress'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'
import { cn } from '@/shared/lib/utils'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { stats, loading: statsLoading } = useUsageStats()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <AnimatedBg variant="blobs" intensity="low" className="min-h-screen flex items-center justify-center">
        <Card variant="processing" className="relative overflow-hidden">
          <BlobDecoration size="lg" color="green" position="center" className="opacity-30" />
          <CardContent className="p-8 text-center relative z-10">
            <div className="w-8 h-8 border-3 border-energy-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-body">LOADING DASHBOARD...</p>
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

  const handleNewVideo = () => {
    router.push('/')
  }

  const getUsagePercentage = () => {
    if (!stats) return 0
    return (stats.current_usage / stats.limit) * 100
  }

  const tierFeatures = {
    FREE: [
      { feature: '3 videos per month', available: true },
      { feature: '720p quality', available: true },
      { feature: 'Watermarked results', available: true },
      { feature: 'Profile & Action modes', available: true },
      { feature: 'HD quality (1080p)', available: false },
      { feature: 'No watermarks', available: false },
      { feature: 'Priority processing', available: false },
      { feature: 'API access', available: false },
    ],
    PRO: [
      { feature: '100 videos per month', available: true },
      { feature: '1080p HD quality', available: true },
      { feature: 'No watermarks', available: true },
      { feature: 'Profile & Action modes', available: true },
      { feature: 'Priority processing', available: true },
      { feature: 'API access', available: true },
      { feature: 'Email support', available: true },
      { feature: 'Batch processing', available: true },
    ],
  }

  return (
    <AnimatedBg variant="blobs" intensity="low" className="min-h-screen">
      {/* Navigation */}
      <Navbar user={user} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        {/* Decorative Elements */}
        <BlobDecoration size="xl" color="gradient" position="top-right" className="opacity-5" />
        <OrganicShape variant="squiggle" size="lg" color="blue" className="top-20 left-10 opacity-10" />

        {/* Welcome Header */}
        <div className="mb-8 relative">
          <AnimatedBg variant="waves" intensity="medium">
            <Card variant="dark" className="bg-gradient-to-br from-void-black to-gray-900 relative overflow-hidden">
              <BlobDecoration size="xl" color="blue" position="top-left" className="opacity-20" />
              <BlobDecoration size="lg" color="green" position="bottom-right" className="opacity-15" />
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="relative">
                    <OrganicShape variant="blob1" size="md" color="gold" className="top-0 right-0 opacity-20" />
                    <h1 className="font-mono text-h1 font-bold text-electric-blue uppercase tracking-wide mb-2">
                      👋 WELCOME BACK!
                    </h1>
                    <p className="font-mono text-body text-gray-200">
                      Ready to extract the best frames from your videos?
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="font-mono text-small text-gray-400">Account:</span>
                      <span className="font-mono text-small text-pure-white">{user.email}</span>
                      <Badge variant={user.tier === 'PRO' ? 'success' : 'info'} size="sm">
                        {user.tier}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 relative">
                    <OrganicShape variant="lightning" size="sm" color="gold" className="top-0 right-0 opacity-30" />
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={handleNewVideo}
                      className="flex items-center gap-2"
                    >
                      📹 PROCESS NEW VIDEO
                    </Button>
                    <span className="font-mono text-caption text-gray-400 text-center">
                      Start your next project
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedBg>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Usage Stats */}
          <div className="lg:col-span-2 relative">
            <OrganicShape variant="blob2" size="lg" color="blue" className="top-0 left-0 opacity-10" />
            <AnimatedBg variant="particles" intensity="low">
              <Card variant="default" hover className="relative overflow-hidden">
                <BlobDecoration size="md" color="green" position="top-right" className="opacity-20" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    📊 USAGE STATISTICS
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {statsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="font-mono text-small text-gray-700">Loading stats...</p>
                    </div>
                  ) : stats ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-body font-medium">This month:</span>
                        <div className="text-right">
                          <span className="font-mono text-h3 font-bold text-void-black">
                            {stats.current_usage} / {stats.limit}
                          </span>
                          <p className="font-mono text-caption text-gray-700">videos processed</p>
                        </div>
                      </div>
                      
                      <Progress 
                        value={getUsagePercentage()} 
                        size="lg"
                        className="mb-4"
                      />
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t-3 border-gray-200">
                        <div className="text-center relative">
                          <OrganicShape variant="blob3" size="sm" color="green" className="top-0 left-1/2 opacity-20" />
                          <div className="font-mono text-h3 font-bold text-energy-green relative z-10">
                            {stats.remaining}
                          </div>
                          <div className="font-mono text-caption text-gray-700 uppercase relative z-10">
                            Remaining
                          </div>
                        </div>
                        <div className="text-center relative">
                          <OrganicShape variant="lightning" size="sm" color="blue" className="top-0 left-1/2 opacity-20" />
                          <div className="font-mono text-h3 font-bold text-electric-blue relative z-10">
                            {((stats.current_usage / stats.limit) * 100).toFixed(0)}%
                          </div>
                          <div className="font-mono text-caption text-gray-700 uppercase relative z-10">
                            Used
                          </div>
                        </div>
                        <div className="text-center relative">
                          <OrganicShape variant="squiggle" size="sm" color="purple" className="top-0 left-1/2 opacity-20" />
                          <div className="font-mono text-h3 font-bold text-deep-purple relative z-10">
                            {stats.limit}
                          </div>
                          <div className="font-mono text-caption text-gray-700 uppercase relative z-10">
                            Total Limit
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-4 block">⚠️</span>
                      <p className="font-mono text-body text-gray-700">Failed to load usage stats</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedBg>
          </div>

          {/* Quick Actions */}
          <Card variant="default" hover className="relative overflow-hidden">
            <BlobDecoration size="lg" color="purple" position="center" className="opacity-10" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3">
                🚀 QUICK ACTIONS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="relative">
                <OrganicShape variant="blob1" size="sm" color="blue" className="top-0 right-0 opacity-15" />
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={handleNewVideo}
                  className="w-full flex items-center justify-center gap-2 relative z-10"
                >
                  📹 NEW VIDEO
                </Button>
              </div>
              
              <div className="relative">
                <OrganicShape variant="blob2" size="sm" color="green" className="top-0 left-0 opacity-15" />
                <Button 
                  variant="secondary" 
                  size="md"
                  className="w-full flex items-center justify-center gap-2 relative z-10"
                >
                  📚 VIEW HISTORY
                </Button>
              </div>
              
              <div className="relative">
                <OrganicShape variant="lightning" size="sm" color="purple" className="bottom-0 right-0 opacity-15" />
                <Button 
                  variant="secondary" 
                  size="md"
                  className="w-full flex items-center justify-center gap-2 relative z-10"
                >
                  ⚙️ SETTINGS
                </Button>
              </div>
              
              {user.tier === 'FREE' && (
                <div className="relative">
                  <BlobDecoration size="md" color="gold" position="center" className="opacity-20" />
                  <Button 
                    variant="primary" 
                    size="md"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-saiyan-gold to-warning-orange relative z-10"
                  >
                    ⬆️ UPGRADE TO PRO
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AnimatedBg variant="grid" intensity="low">
            <Card variant="default" hover className="relative overflow-hidden">
              <BlobDecoration size="md" color="blue" position="top-left" className="opacity-15" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3">
                  👤 ACCOUNT INFORMATION
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 gap-4 font-mono text-small">
                  <div className="relative">
                    <OrganicShape variant="blob3" size="sm" color="blue" className="top-0 right-0 opacity-10" />
                    <span className="text-gray-700 font-medium block mb-1">EMAIL:</span>
                    <span className="text-void-black font-bold">{user.email}</span>
                  </div>
                  
                  <div className="relative">
                    <OrganicShape variant="squiggle" size="sm" color="green" className="top-0 left-0 opacity-10" />
                    <span className="text-gray-700 font-medium block mb-1">PLAN:</span>
                    <Badge variant={user.tier === 'PRO' ? 'success' : 'info'} size="md">
                      {user.tier}
                    </Badge>
                  </div>
                  
                  <div className="relative">
                    <OrganicShape variant="lightning" size="sm" color="gold" className="bottom-0 right-0 opacity-10" />
                    <span className="text-gray-700 font-medium block mb-1">STATUS:</span>
                    <span className={cn(
                      "font-bold flex items-center gap-1",
                      user.is_active ? "text-energy-green" : "text-warning-orange"
                    )}>
                      {user.is_active ? '✅ ACTIVE' : '❌ INACTIVE'}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <OrganicShape variant="blob1" size="sm" color="purple" className="bottom-0 left-0 opacity-10" />
                    <span className="text-gray-700 font-medium block mb-1">MEMBER SINCE:</span>
                    <span className="text-void-black font-bold">
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : 'Unknown'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedBg>

          {/* Current Plan Features */}
          <Card variant="default" hover className="relative overflow-hidden">
            <BlobDecoration size="lg" color="gradient" position="bottom-right" className="opacity-10" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3">
                ⭐ YOUR PLAN FEATURES
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {tierFeatures[user.tier as keyof typeof tierFeatures].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 relative">
                    {index % 3 === 0 && (
                      <OrganicShape 
                        variant={index % 2 === 0 ? "blob2" : "blob3"} 
                        size="sm" 
                        color={item.available ? "green" : "purple"} 
                        className="top-0 right-0 opacity-10" 
                      />
                    )}
                    <span className={cn(
                      "w-5 h-5 flex items-center justify-center text-sm relative z-10",
                      item.available ? "text-energy-green" : "text-gray-400"
                    )}>
                      {item.available ? '✅' : '❌'}
                    </span>
                    <span className={cn(
                      "font-mono text-small relative z-10",
                      item.available ? "text-void-black" : "text-gray-400 line-through"
                    )}>
                      {item.feature}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Section for Free Users */}
        {user.tier === 'FREE' && (
          <AnimatedBg variant="waves" intensity="medium" className="mb-8">
            <Card variant="default" className="bg-gradient-to-br from-saiyan-gold/10 to-warning-orange/10 border-saiyan-gold relative overflow-hidden">
              <BlobDecoration size="xl" color="gold" position="top-left" className="opacity-20" />
              <BlobDecoration size="lg" color="purple" position="bottom-right" className="opacity-15" />
              <OrganicShape variant="lightning" size="lg" color="gold" className="top-1/4 right-1/4 opacity-20" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-saiyan-gold flex items-center gap-3">
                  ⬆️ UPGRADE TO PRO
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="font-mono text-body text-void-black mb-6">
                  Unlock the full potential of Frame Picker with our Pro plan!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <OrganicShape variant="blob1" size="md" color="blue" className="top-0 right-0 opacity-10" />
                    <h4 className="font-mono font-bold text-body uppercase mb-3 text-gray-700 relative z-10">
                      FREE (CURRENT)
                    </h4>
                    <ul className="space-y-2 font-mono text-small relative z-10">
                      <li className="flex items-center gap-2">
                        <Badge variant="info" size="sm">3</Badge>
                        <span>videos per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="warning" size="sm">720P</Badge>
                        <span>quality with watermark</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="info" size="sm">BASIC</Badge>
                        <span>support</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="relative">
                    <OrganicShape variant="blob2" size="md" color="gold" className="top-0 left-0 opacity-15" />
                    <h4 className="font-mono font-bold text-body uppercase mb-3 text-saiyan-gold relative z-10">
                      PRO ($2.99/MONTH)
                    </h4>
                    <ul className="space-y-2 font-mono text-small relative z-10">
                      <li className="flex items-center gap-2">
                        <Badge variant="success" size="sm">100</Badge>
                        <span>videos per month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="success" size="sm">1080P</Badge>
                        <span>HD without watermark</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="success" size="sm">PRIORITY</Badge>
                        <span>processing & support</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="relative z-10">
                <Button 
                  variant="primary" 
                  size="lg"
                  className="w-full bg-gradient-to-r from-saiyan-gold to-warning-orange text-void-black font-bold"
                >
                  🚀 UPGRADE NOW - $2.99/MONTH
                </Button>
              </CardFooter>
            </Card>
          </AnimatedBg>
        )}

        {/* Recent Activity */}
        <AnimatedBg variant="particles" intensity="medium">
          <Card variant="dark" hover className="relative overflow-hidden">
            <BlobDecoration size="xl" color="blue" position="top-right" className="opacity-15" />
            <BlobDecoration size="lg" color="green" position="bottom-left" className="opacity-10" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-electric-blue flex items-center gap-3">
                📈 RECENT ACTIVITY
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-center py-12">
                <OrganicShape variant="squiggle" size="lg" color="gold" className="top-0 left-1/4 opacity-20" />
                <OrganicShape variant="lightning" size="md" color="blue" className="bottom-0 right-1/4 opacity-15" />
                
                <div className="text-6xl mb-4 relative z-10">🎬</div>
                <h3 className="font-mono text-h3 font-bold text-pure-white uppercase mb-2 relative z-10">
                  NO RECENT ACTIVITY
                </h3>
                <p className="font-mono text-body text-gray-400 mb-6 relative z-10">
                  Start processing videos to see your activity here
                </p>
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={handleNewVideo}
                  className="relative z-10"
                >
                  🚀 PROCESS FIRST VIDEO
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedBg>

        {/* Floating decorative elements */}
        <OrganicShape variant="blob3" size="lg" color="purple" className="bottom-20 right-10 opacity-5 animate-float" />
        <OrganicShape variant="squiggle" size="md" color="green" className="bottom-40 left-20 opacity-10 animate-float" />
      </main>
    </AnimatedBg>
  )
}
