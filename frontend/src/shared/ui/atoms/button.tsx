'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/shared/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-mono font-bold uppercase tracking-wide',
      'border-3 border-void-black',
      'transition-all duration-100 ease-neo',
      'focus:outline-none focus:ring-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:translate-x-0 active:translate-y-0',
    ]

    const variants = {
      primary: [
        'bg-gradient-to-br from-electric-blue to-electric-blue-dark',
        'text-void-black shadow-neo',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-md',
        'active:shadow-neo-sm',
      ],
      secondary: [
        'bg-transparent border-electric-blue text-electric-blue',
        'shadow-neo-blue',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-md',
        'hover:bg-electric-blue hover:text-void-black',
        'active:shadow-neo-sm',
      ],
      danger: [
        'bg-gradient-to-br from-warning-orange to-red-600',
        'text-pure-white shadow-neo',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-md',
        'active:shadow-neo-sm',
      ],
      ghost: [
        'bg-transparent border-gray-700 text-gray-700',
        'hover:bg-gray-100 hover:text-void-black',
        'shadow-none hover:shadow-neo-sm',
      ],
    }

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3 text-body',
      lg: 'px-8 py-4 text-h3',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
