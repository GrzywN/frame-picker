'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import VideoProcessor from './video-processor'
import ProcessingHistory from './processing-history'
import BillingManager from './billing-manager'
import UserMenu from './user-menu'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'process' | 'history' | 'billing'>('process')

  return (
    <main className="container">
      {/* Header */}
      <nav>
        <ul>
          <li><strong>🎬 Frame Picker</strong></li>
        </ul>
        <ul>
          <li><UserMenu /></li>
        </ul>
      </nav>

      {/* Welcome Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Welcome back, {user?.email}!</h2>
        <p>
          Current plan: <strong>{profile?.current_tier === 'pro' ? 'Pro' : 'Free'}</strong>
          {profile?.current_tier === 'free' && (
            <>
              {' • '}
              <a href="#" onClick={(e) => {
                e.preventDefault()
                setActiveTab('billing')
              }}>
                Upgrade to Pro →
              </a>
            </>
          )}
        </p>
      </section>

      {/* Navigation Tabs */}
      <nav style={{ marginBottom: '2rem' }}>
        <ul role="tablist" style={{ 
          display: 'flex', 
          listStyle: 'none', 
          gap: '1rem',
          borderBottom: '1px solid var(--pico-color-grey-200)',
          padding: 0,
          margin: 0
        }}>
          <li>
            <a
              href="#"
              role="tab"
              aria-selected={activeTab === 'process'}
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('process')
              }}
              style={{
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === 'process' ? '2px solid var(--pico-color-azure-500)' : 'none',
                color: activeTab === 'process' ? 'var(--pico-color-azure-500)' : 'inherit'
              }}
            >
              🎬 Process Video
            </a>
          </li>
          <li>
            <a
              href="#"
              role="tab"
              aria-selected={activeTab === 'history'}
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('history')
              }}
              style={{
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === 'history' ? '2px solid var(--pico-color-azure-500)' : 'none',
                color: activeTab === 'history' ? 'var(--pico-color-azure-500)' : 'inherit'
              }}
            >
              📊 History
            </a>
          </li>
          <li>
            <a
              href="#"
              role="tab"
              aria-selected={activeTab === 'billing'}
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('billing')
              }}
              style={{
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === 'billing' ? '2px solid var(--pico-color-azure-500)' : 'none',
                color: activeTab === 'billing' ? 'var(--pico-color-azure-500)' : 'inherit'
              }}
            >
              💳 Billing
            </a>
          </li>
        </ul>
      </nav>

      {/* Tab Content */}
      <div role="tabpanel">
        {activeTab === 'process' && <VideoProcessor />}
        
        {activeTab === 'history' && <ProcessingHistory />}
        
        {activeTab === 'billing' && <BillingManager />}
      </div>
    </main>
  )
}
