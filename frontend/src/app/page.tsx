'use client'

import { useAuth } from '@/lib/auth'
import AuthPage from '@/components/auth-page'
import Dashboard from '@/components/dashboard'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div aria-busy="true">Loading...</div>
        </div>
      </main>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <Dashboard />
}
