/**
 * Usage statistics display component
 */
'use client'

import { useUsageStats } from '@/shared/hooks/use-usage-stats'
import { useAuth } from '@/shared/hooks/use-auth'

export function UsageStats() {
  const { user } = useAuth()
  const { stats, loading, error } = useUsageStats()

  if (!user) {
    return (
      <div style={{ 
        padding: '1rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        fontSize: '0.9rem'
      }}>
        <strong>🔓 Anonymous Usage:</strong> 1 video per day
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <progress />
        <p>Loading usage stats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '1rem',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        color: '#721c24'
      }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const getUsageColor = () => {
    const percentage = (stats.current_usage / stats.limit) * 100
    if (percentage >= 90) return '#dc3545'
    if (percentage >= 70) return '#ffc107'
    return '#28a745'
  }

  const tierInfo = user.tier === 'FREE' 
    ? { name: 'Free', color: '#6c757d', period: 'month' }
    : { name: 'Pro', color: '#007bff', period: 'month' }

  return (
    <div style={{ 
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '4px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <strong>📊 Usage Statistics</strong>
        <span style={{ 
          backgroundColor: tierInfo.color,
          color: 'white',
          padding: '0.2rem 0.5rem',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          {tierInfo.name}
        </span>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        fontSize: '0.9rem',
        marginBottom: '0.5rem'
      }}>
        <span>This {tierInfo.period}:</span>
        <span style={{ color: getUsageColor(), fontWeight: 'bold' }}>
          {stats.current_usage} / {stats.limit}
        </span>
      </div>

      <div style={{ 
        width: '100%',
        height: '8px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '0.5rem'
      }}>
        <div style={{
          width: `${Math.min((stats.current_usage / stats.limit) * 100, 100)}%`,
          height: '100%',
          backgroundColor: getUsageColor(),
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
        {stats.remaining > 0 ? (
          <span>✅ {stats.remaining} videos remaining</span>
        ) : (
          <span>⚠️ Monthly limit reached</span>
        )}
      </div>

      {user.tier === 'FREE' && (
        <div style={{ 
          marginTop: '0.5rem',
          fontSize: '0.8rem'
        }}>
          <a href="#upgrade" style={{ color: '#007bff' }}>
            ⬆️ Upgrade to Pro for 100 videos/month
          </a>
        </div>
      )}
    </div>
  )
}
