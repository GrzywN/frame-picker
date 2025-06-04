'use client'

import { useUsageStats } from '@/shared/hooks/use-usage-stats'
import { useAuth } from '@/shared/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/molecules/card'
import { Badge } from '@/shared/ui/atoms/badge'
import { Progress } from '@/shared/ui/atoms/progress'
import { Button } from '@/shared/ui/atoms/button'

export function UsageStats() {
  const { user } = useAuth()
  const { stats, loading, error } = useUsageStats()

  if (!user) {
    return (
      <Card variant="default" className="bg-warning-orange/10 border-warning-orange">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔓</span>
            <div>
              <span className="font-mono font-bold text-void-black uppercase">
                ANONYMOUS USAGE
              </span>
              <p className="font-mono text-small text-void-black">
                1 video per day • 720p with watermark
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card variant="processing">
        <CardContent className="p-4 text-center">
          <div className="w-6 h-6 border-2 border-energy-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="font-mono text-small">LOADING STATS...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="default" className="bg-warning-orange/10 border-warning-orange">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <span className="font-mono font-bold text-void-black">ERROR</span>
              <p className="font-mono text-small text-void-black">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const getUsageVariant = (): 'success' | 'warning' | 'error' => {
    const percentage = (stats.current_usage / stats.limit) * 100
    if (percentage >= 90) return 'error'
    if (percentage >= 70) return 'warning'
    return 'success'
  }

  const tierInfo = {
    FREE: { name: 'Free', color: 'info' as const, period: 'month' },
    PRO: { name: 'Pro', color: 'success' as const, period: 'month' },
  }

  const currentTier = tierInfo[user.tier as keyof typeof tierInfo]

  return (
    <Card variant="default" hover className="bg-gray-100 border-electric-blue">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            📊 USAGE STATISTICS
          </CardTitle>
          <Badge variant={currentTier.color} size="md">
            {currentTier.name.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-small font-medium text-gray-700">
            THIS {currentTier.period.toUpperCase()}:
          </span>
          <span className="font-mono text-body font-bold text-void-black">
            {stats.current_usage} / {stats.limit}
          </span>
        </div>

        <Progress 
          value={(stats.current_usage / stats.limit) * 100} 
          size="md"
        />

        <div className="text-center">
          {stats.remaining > 0 ? (
            <span className="font-mono text-small text-energy-green font-bold">
              ✅ {stats.remaining} VIDEOS REMAINING
            </span>
          ) : (
            <span className="font-mono text-small text-warning-orange font-bold">
              ⚠️ MONTHLY LIMIT REACHED
            </span>
          )}
        </div>

        {user.tier === 'FREE' && (
          <div className="pt-3 border-t-2 border-gray-200 text-center">
            <Button variant="secondary" size="sm">
              ⬆️ UPGRADE TO PRO
            </Button>
            <p className="font-mono text-caption text-gray-700 mt-2">
              100 videos/month • HD quality • No watermarks
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
