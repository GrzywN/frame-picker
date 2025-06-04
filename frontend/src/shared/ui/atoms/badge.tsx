'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'error' | 'processing' | 'warning' | 'info'
  size?: 'sm' | 'md'
}

const Badge = ({ className, variant = 'info', size = 'md', children, ...props }: BadgeProps) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-mono font-bold uppercase',
    'border-2 border-void-black',
    'text-center',
  ]

  const variants = {
    success: 'bg-energy-green text-void-black',
    error: 'bg-warning-orange text-pure-white',
    processing: 'bg-deep-purple text-pure-white animate-pulse-slow',
    warning: 'bg-saiyan-gold text-void-black',
    info: 'bg-electric-blue text-void-black',
  }

  const sizes = {
    sm: 'px-2 py-1 text-caption',
    md: 'px-3 py-1 text-small',
  }

  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
