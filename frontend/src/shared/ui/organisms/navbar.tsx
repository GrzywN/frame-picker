'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { Button } from '../atoms/button'
import { Badge } from '../atoms/badge'

export interface NavbarProps {
  user?: {
    id: string
    email: string
    tier: 'FREE' | 'PRO'
    is_active: boolean
  } | null
  onSignOut?: () => void
  className?: string
}

const Navbar = ({ user, onSignOut, className }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className={cn(
      'sticky top-0 z-50',
      'bg-void-black border-b-4 border-electric-blue',
      'px-4 py-4',
      className
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="text-3xl">🎬</div>
          <div className="font-mono text-h3 font-bold text-electric-blue uppercase tracking-wider group-hover:text-energy-green transition-colors">
            FRAME PICKER
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-mono text-small text-gray-200">
                  {user.email}
                </span>
                <Badge 
                  variant={user.tier === 'PRO' ? 'success' : 'info'}
                  size="sm"
                >
                  {user.tier}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm">
                    DASHBOARD
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onSignOut}
                  className="text-gray-200 border-gray-200 hover:bg-gray-200 hover:text-void-black"
                >
                  SIGN OUT
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="secondary" size="sm">
                  LOGIN
                </Button>
              </Link>
              
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  REGISTER
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex flex-col gap-1 p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className={cn(
            'w-6 h-0.5 bg-electric-blue transition-all',
            isMenuOpen && 'rotate-45 translate-y-1.5'
          )} />
          <div className={cn(
            'w-6 h-0.5 bg-electric-blue transition-all',
            isMenuOpen && 'opacity-0'
          )} />
          <div className={cn(
            'w-6 h-0.5 bg-electric-blue transition-all',
            isMenuOpen && '-rotate-45 -translate-y-1.5'
          )} />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 p-4 bg-gray-900 border-3 border-electric-blue">
          {user ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-mono text-small text-gray-200 mb-2">
                  {user.email}
                </p>
                <Badge 
                  variant={user.tier === 'PRO' ? 'success' : 'info'}
                  size="sm"
                >
                  {user.tier}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Link href="/dashboard" className="block">
                  <Button variant="secondary" size="md" className="w-full">
                    DASHBOARD
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  size="md"
                  onClick={onSignOut}
                  className="w-full text-gray-200 border-gray-200 hover:bg-gray-200 hover:text-void-black"
                >
                  SIGN OUT
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/auth/login" className="block">
                <Button variant="secondary" size="md" className="w-full">
                  LOGIN
                </Button>
              </Link>
              
              <Link href="/auth/register" className="block">
                <Button variant="primary" size="md" className="w-full">
                  REGISTER
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export { Navbar }
