'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/shared/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, success, ...props }, ref) => {
    const baseClasses = [
      'w-full px-4 py-3',
      'font-mono text-body',
      'bg-pure-white border-3 border-void-black',
      'transition-all duration-100 ease-neo',
      'focus:outline-none focus:border-electric-blue',
      'focus:shadow-[0_0_0_3px_rgba(0,229,255,0.2)]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-gray-700',
    ]

    const stateClasses = {
      error: 'border-warning-orange focus:border-warning-orange focus:shadow-[0_0_0_3px_rgba(255,107,53,0.2)]',
      success: 'border-energy-green focus:border-energy-green focus:shadow-[0_0_0_3px_rgba(57,255,20,0.2)]',
    }

    return (
      <input
        ref={ref}
        className={cn(
          baseClasses,
          error && stateClasses.error,
          success && stateClasses.success,
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
