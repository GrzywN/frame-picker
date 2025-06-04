'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'processing' | 'elevated' | 'dark'
  hover?: boolean
}

const Card = ({ 
  className, 
  variant = 'default', 
  hover = false, 
  children, 
  ...props 
}: CardProps) => {
  const baseClasses = [
    'border-3 border-void-black p-6',
    'transition-all duration-200 ease-neo',
  ]

  const variants = {
    default: [
      'bg-pure-white shadow-neo-lg',
      hover && 'hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo-xl',
    ],
    processing: [
      'bg-gradient-to-br from-gray-900 to-gray-700',
      'border-energy-green shadow-neo-green text-pure-white',
      hover && 'hover:-translate-x-1 hover:-translate-y-1',
    ],
    elevated: [
      'bg-pure-white shadow-neo-xl',
      hover && 'hover:-translate-x-2 hover:-translate-y-2',
    ],
    dark: [
      'bg-gray-900 border-gray-700 shadow-neo-gray text-pure-white',
      hover && 'hover:-translate-x-1 hover:-translate-y-1',
    ],
  }

  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
)

const CardTitle = ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-mono text-h3 font-bold uppercase tracking-wide', className)} {...props}>
    {children}
  </h3>
)

const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('font-mono text-body', className)} {...props}>
    {children}
  </div>
)

const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-4 flex items-center gap-2', className)} {...props}>
    {children}
  </div>
)

export { Card, CardHeader, CardTitle, CardContent, CardFooter }
