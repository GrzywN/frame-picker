'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
}

const Logo = ({ 
  className, 
  variant = 'full', 
  size = 'md', 
  animated = false,
  ...props 
}: LogoProps) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12', 
    lg: 'h-16',
    xl: 'h-24',
  }

  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center', className)} {...props}>
        <LogoIcon size={size} animated={animated} />
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={cn('flex items-center', className)} {...props}>
        <LogoText size={size} />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)} {...props}>
      <LogoIcon size={size} animated={animated} />
      <LogoText size={size} />
    </div>
  )
}

// Logo Icon Component
const LogoIcon = ({ size, animated }: { size: string; animated: boolean }) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  }
  
  const iconSize = sizeMap[size as keyof typeof sizeMap]
  
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'animate-float' : ''}
    >
      {/* Outer frame */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="8"
        stroke="#00E5FF"
        strokeWidth="4"
        fill="none"
      />
      
      {/* Inner frame with gradient */}
      <rect
        x="20"
        y="20"
        width="60"
        height="60"
        rx="4"
        fill="url(#logoGradient)"
        stroke="#000"
        strokeWidth="2"
      />
      
      {/* AI targeting reticle */}
      <circle
        cx="50"
        cy="50"
        r="15"
        stroke="#39FF14"
        strokeWidth="3"
        fill="none"
        strokeDasharray="8 4"
        className={animated ? 'animate-spin' : ''}
        style={{ animationDuration: '4s' }}
      />
      
      {/* Center dot */}
      <circle
        cx="50"
        cy="50"
        r="3"
        fill="#FFD700"
      />
      
      {/* Corner brackets */}
      <path
        d="M25 30 L25 25 L30 25"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M70 25 L75 25 L75 30"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M75 70 L75 75 L70 75"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 75 L25 75 L25 70"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#39FF14" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Logo Text Component
const LogoText = ({ size }: { size: string }) => {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl', 
    xl: 'text-3xl',
  }
  
  return (
    <div className={cn(
      'font-mono font-bold uppercase tracking-wider',
      textSizes[size as keyof typeof textSizes]
    )}>
      <span className="text-electric-blue">FRAME</span>
      <span className="text-energy-green">PICKER</span>
    </div>
  )
}

// Favicon SVG (simplified for small sizes)
export const FaviconSVG = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="28" height="28" rx="4" fill="#00E5FF"/>
    <rect x="6" y="6" width="20" height="20" rx="2" fill="#000"/>
    <circle cx="16" cy="16" r="6" stroke="#39FF14" strokeWidth="2" fill="none"/>
    <circle cx="16" cy="16" r="2" fill="#FFD700"/>
  </svg>
)

// Apple Touch Icon SVG (higher contrast for iOS)
export const AppleTouchIconSVG = () => (
  <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="180" height="180" rx="40" fill="#00E5FF"/>
    <rect x="20" y="20" width="140" height="140" rx="12" fill="#000"/>
    <circle cx="90" cy="90" r="35" stroke="#39FF14" strokeWidth="6" fill="none"/>
    <circle cx="90" cy="90" r="8" fill="#FFD700"/>
    
    {/* Corner brackets */}
    <path d="M40 55 L40 40 L55 40" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round"/>
    <path d="M125 40 L140 40 L140 55" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round"/>
    <path d="M140 125 L140 140 L125 140" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round"/>
    <path d="M55 140 L40 140 L40 125" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round"/>
  </svg>
)

export { Logo }