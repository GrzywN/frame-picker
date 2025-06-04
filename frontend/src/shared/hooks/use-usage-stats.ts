/**
 * Usage statistics hook
 */
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { authApi } from '@/core/api/auth'
import { UsageStats } from '@/core/types/auth'

export function useUsageStats() {
  const { accessToken, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setStats(null)
      return
    }

    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const usageStats = await authApi.getUsageStats(accessToken)
        setStats(usageStats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [accessToken, isAuthenticated])

  return { stats, loading, error, refetch: () => {} }
}
