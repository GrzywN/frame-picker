/**
 * Auth error page
 */
'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please try again.'
      case 'Configuration':
        return 'Authentication configuration error.'
      case 'Verification':
        return 'Email verification failed.'
      default:
        return 'An authentication error occurred. Please try again.'
    }
  }

  return (
    <main className="container" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <article style={{
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        color: '#721c24'
      }}>
        <header>
          <strong>❌ Authentication Error</strong>
        </header>
        <p>{getErrorMessage(error)}</p>
        <footer>
          <a href="/auth/login" className="outline">
            🔄 Try Again
          </a>
        </footer>
      </article>
    </main>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
