'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/ui/molecules/card'
import { FormField } from '@/shared/ui/molecules/form-field'
import { Button } from '@/shared/ui/atoms/button'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Attempting login with:', { email })
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('Login result:', result)

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        const session = await getSession()
        console.log('Session after login:', session)
        
        if (session) {
          router.push('/dashboard')
        } else {
          setError('Failed to create session')
        }
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedBg variant="blobs" intensity="medium" className="min-h-screen flex items-center justify-center p-4">
      {/* Floating decorative elements */}
      <OrganicShape variant="squiggle" size="lg" color="blue" className="top-20 left-10 opacity-20 animate-float" />
      <OrganicShape variant="lightning" size="md" color="green" className="bottom-20 right-10 opacity-15 animate-float" />
      <BlobDecoration size="xl" color="gradient" position="top-right" className="opacity-10" />
      
      <div className="w-full max-w-prose relative z-10">
        <Card variant="default" className="shadow-neo-xl relative overflow-hidden">
          <BlobDecoration size="lg" color="blue" position="top-left" className="opacity-20" />
          <BlobDecoration size="md" color="green" position="bottom-right" className="opacity-15" />
          
          <CardHeader className="text-center relative z-10">
            <div className="text-6xl mb-4">🎬</div>
            <CardTitle className="text-electric-blue">
              LOGIN TO FRAME PICKER
            </CardTitle>
            <OrganicShape variant="blob1" size="sm" color="purple" className="top-0 right-0 opacity-20" />
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 relative z-10">
              <div className="relative">
                <OrganicShape variant="blob2" size="sm" color="blue" className="top-0 right-0 opacity-10" />
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
                <OrganicShape variant="lightning" size="sm" color="green" className="bottom-0 left-0 opacity-10" />
                <FormField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Your password"
                  className="relative z-10"
                />
              </div>

              {error && (
                <Card variant="default" className="bg-warning-orange/10 border-warning-orange relative overflow-hidden">
                  <BlobDecoration size="sm" color="gold" position="center" className="opacity-30" />
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
                🚀 SIGN IN
              </Button>

              <div className="text-center">
                <span className="font-mono text-small text-gray-700">
                  Don't have an account?{' '}
                </span>
                <a 
                  href="/auth/register" 
                  className="font-mono text-small text-electric-blue hover:text-energy-green font-bold transition-colors"
                >
                  CREATE ONE HERE
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AnimatedBg>
  )
}
