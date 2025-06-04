'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/core/api/auth'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/ui/molecules/card'
import { FormField } from '@/shared/ui/molecules/form-field'
import { Button } from '@/shared/ui/atoms/button'
import { Badge } from '@/shared/ui/atoms/badge'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      // Register user
      await authApi.register({ email, password })

      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Registration successful, but auto-login failed. Please login manually.')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedBg variant="waves" intensity="medium" className="min-h-screen flex items-center justify-center p-4">
      {/* Floating decorative elements */}
      <OrganicShape variant="blob1" size="xl" color="purple" className="top-10 right-20 opacity-15 animate-float" />
      <OrganicShape variant="squiggle" size="lg" color="gold" className="bottom-10 left-20 opacity-20 animate-float" />
      <BlobDecoration size="lg" color="gradient" position="bottom-left" className="opacity-10" />
      
      <div className="w-full max-w-prose relative z-10">
        <Card variant="default" className="shadow-neo-xl relative overflow-hidden">
          <BlobDecoration size="xl" color="blue" position="top-right" className="opacity-15" />
          <BlobDecoration size="md" color="purple" position="bottom-left" className="opacity-20" />
          
          <CardHeader className="text-center relative z-10">
            <div className="text-6xl mb-4">🎬</div>
            <CardTitle className="text-electric-blue">
              JOIN FRAME PICKER
            </CardTitle>
            <p className="font-mono text-small text-gray-700 mt-2">
              Create your account to start extracting the best frames
            </p>
            <OrganicShape variant="lightning" size="md" color="gold" className="top-0 left-0 opacity-15" />
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 relative z-10">
              <div className="relative">
                <OrganicShape variant="blob2" size="sm" color="blue" className="top-0 right-0 opacity-15" />
                <FormField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="your@email.com"
                  className="relative z-10"
                />
              </div>

              <div className="relative">
                <OrganicShape variant="blob3" size="sm" color="green" className="top-0 left-0 opacity-15" />
                <FormField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="At least 8 characters"
                  hint="Minimum 8 characters"
                  className="relative z-10"
                />
              </div>

              <div className="relative">
                <OrganicShape variant="squiggle" size="sm" color="purple" className="bottom-0 right-0 opacity-15" />
                <FormField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Repeat your password"
                  className="relative z-10"
                />
              </div>

              {error && (
                <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
                  <BlobDecoration size="md" color="gold" position="center" className="opacity-30" />
                  <CardContent className="p-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚠️</span>
                      <span className="font-mono text-small text-void-black">{error}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>

            <CardFooter className="flex-col space-y-4 relative z-10">
              <Button 
                type="submit" 
                variant="primary"
                size="lg"
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                🚀 CREATE ACCOUNT
              </Button>

              <div className="text-center">
                <span className="font-mono text-small text-gray-700">
                  Already have an account?{' '}
                </span>
                <a 
                  href="/auth/login" 
                  className="font-mono text-small text-electric-blue hover:text-energy-green font-bold transition-colors"
                >
                  SIGN IN HERE
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Free Account Benefits */}
        <AnimatedBg variant="particles" intensity="low" className="mt-6">
          <Card variant="default" className="bg-electric-blue/10 border-electric-blue relative overflow-hidden">
            <BlobDecoration size="lg" color="blue" position="top-left" className="opacity-20" />
            <BlobDecoration size="md" color="green" position="bottom-right" className="opacity-15" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-electric-blue flex items-center gap-2">
                🆓 FREE ACCOUNT INCLUDES
              </CardTitle>
              <OrganicShape variant="blob1" size="sm" color="gold" className="top-0 right-0 opacity-20" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 gap-3 font-mono text-small">
                <div className="flex items-center gap-2 relative">
                  <OrganicShape variant="lightning" size="sm" color="blue" className="top-0 right-0 opacity-10" />
                  <Badge variant="info" size="sm">3</Badge>
                  <span>Videos/month</span>
                </div>
                <div className="flex items-center gap-2 relative">
                  <OrganicShape variant="blob2" size="sm" color="green" className="bottom-0 left-0 opacity-10" />
                  <Badge variant="info" size="sm">720P</Badge>
                  <span>Quality frames</span>
                </div>
                <div className="flex items-center gap-2 relative">
                  <OrganicShape variant="squiggle" size="sm" color="gold" className="top-0 left-0 opacity-10" />
                  <Badge variant="warning" size="sm">WM</Badge>
                  <span>Watermarked</span>
                </div>
                <div className="flex items-center gap-2 relative">
                  <OrganicShape variant="blob3" size="sm" color="purple" className="bottom-0 right-0 opacity-10" />
                  <Badge variant="success" size="sm">AI</Badge>
                  <span>Both modes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedBg>
      </div>
    </AnimatedBg>
  )
}
