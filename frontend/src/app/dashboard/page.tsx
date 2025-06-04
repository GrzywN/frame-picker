/**
 * Dashboard page for authenticated users
 */
'use client'

import { useAuth } from '@/shared/hooks/use-auth'
import { UsageStats } from '@/features/auth/components/usage-stats'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <progress />
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Redirect will happen in useEffect
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleNewVideo = () => {
    router.push('/')
  }

  return (
    <main className="container">
      {/* Header */}
      <nav style={{ marginBottom: '2rem' }}>
        <ul>
          <li><strong>🎬 Frame Picker</strong></li>
        </ul>
        <ul>
          <li>
            <details role="list">
              <summary aria-haspopup="listbox">{user.email}</summary>
              <ul role="listbox">
                <li>
                  <a href="#" onClick={handleSignOut}>
                    🚪 Sign Out
                  </a>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </nav>

      {/* Welcome Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h1>👋 Welcome back!</h1>
        <p>Ready to extract the best frames from your videos?</p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <UsageStats />
          
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: '4px'
          }}>
            <h3>🚀 Quick Start</h3>
            <p>Upload a video and let AI find the perfect frames for you.</p>
            <button onClick={handleNewVideo} style={{ width: '100%' }}>
              📹 Process New Video
            </button>
          </div>
        </div>
      </section>

      {/* Account Info */}
      <section>
        <h2>📋 Account Information</h2>
        
        <article>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem' 
          }}>
            <div>
              <strong>Email:</strong>
              <p>{user.email}</p>
            </div>
            <div>
              <strong>Plan:</strong>
              <p>
                <span style={{ 
                  backgroundColor: user.tier === 'PRO' ? '#007bff' : '#6c757d',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem'
                }}>
                  {user.tier}
                </span>
              </p>
            </div>
            <div>
              <strong>Status:</strong>
              <p>
                <span style={{ color: user.is_active ? '#28a745' : '#dc3545' }}>
                  {user.is_active ? '✅ Active' : '❌ Inactive'}
                </span>
              </p>
            </div>
            <div>
              <strong>Member since:</strong>
              <p>
                {user.created_at 
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'Unknown'
                }
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* Upgrade Section for Free Users */}
      {user.tier === 'FREE' && (
        <section style={{ marginTop: '2rem' }}>
          <article style={{ 
            backgroundColor: '#fff3cd',
            borderColor: '#ffeaa7'
          }}>
            <header>
              <strong>⬆️ Upgrade to Pro</strong>
            </header>
            <p>Get more videos, higher quality, and no watermarks!</p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              margin: '1rem 0'
            }}>
              <div>
                <strong>Free (Current)</strong>
                <ul>
                  <li>3 videos/month</li>
                  <li>720p quality</li>
                  <li>Watermarked</li>
                </ul>
              </div>
              <div>
                <strong>Pro ($2.99/month)</strong>
                <ul>
                  <li>100 videos/month</li>
                  <li>1080p quality</li>
                  <li>No watermarks</li>
                  <li>Priority processing</li>
                </ul>
              </div>
            </div>
            
            <button className="outline">
              🚀 Upgrade to Pro
            </button>
          </article>
        </section>
      )}
    </main>
  )
}
