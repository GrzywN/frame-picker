'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const Progress = ({ 
  className, 
  value, 
  max = 100, 
  showLabel = false, 
  size = 'md',
  ...props 
}: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-small font-medium text-void-black">
            Progress
          </span>
          <span className="font-mono text-small font-bold text-void-black">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 border-2 border-void-black overflow-hidden',
        sizes[size]
      )}>
        <div
          className="h-full bg-gradient-to-r from-energy-green to-electric-blue border-r-2 border-void-black transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export { Progress }
