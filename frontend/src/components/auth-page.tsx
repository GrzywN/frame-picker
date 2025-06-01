'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signIn, signUp, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Check your email for confirmation link!')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset email sent!')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '4rem' }}>
        <nav>
          <ul>
            <li><strong>🎬 Frame Picker</strong></li>
          </ul>
          <ul>
            <li><small>AI-powered video frame selection</small></li>
          </ul>
        </nav>

        <article>
          <header>
            <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          </header>

          {error && (
            <div style={{ 
              color: 'var(--pico-color-red-500)', 
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: 'var(--pico-color-red-50)',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ 
              color: 'var(--pico-color-green-500)', 
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: 'var(--pico-color-green-50)',
              borderRadius: '4px'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="your@email.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Your password"
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <footer>
            <p>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setIsSignUp(!isSignUp)
                  setError('')
                  setMessage('')
                }}
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </a>
            </p>

            {!isSignUp && (
              <p>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleResetPassword()
                  }}
                >
                  Forgot your password?
                </a>
              </p>
            )}
          </footer>
        </article>

        <article style={{ marginTop: '2rem' }}>
          <header>🎯 How Frame Picker Works</header>
          <ol>
            <li><strong>Upload</strong> your video (MP4, MOV, AVI)</li>
            <li><strong>Choose</strong> profile or action mode</li>
            <li><strong>AI analyzes</strong> and finds the best frames</li>
            <li><strong>Download</strong> high-quality images</li>
          </ol>
          <footer>
            <small>
              <strong>Free:</strong> 3 videos/month, up to 3 frames each<br />
              <strong>Pro ($2.99/month):</strong> 100 videos, 10 frames, HD quality
            </small>
          </footer>
        </article>
      </div>
    </main>
  )
}
