'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface BlobDecorationProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'green' | 'gold' | 'purple' | 'gradient'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  animated?: boolean
}

const BlobDecoration = ({ 
  className,
  size = 'md',
  color = 'blue',
  position = 'top-right',
  animated = true,
  ...props 
}: BlobDecorationProps) => {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  }
  
  const colors = {
    blue: 'bg-electric-blue',
    green: 'bg-energy-green',
    gold: 'bg-saiyan-gold', 
    purple: 'bg-deep-purple',
    gradient: 'bg-gradient-to-br from-electric-blue via-energy-green to-saiyan-gold',
  }
  
  const positions = {
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }

  return (
    <div
      className={cn(
        'absolute rounded-full opacity-20 blur-2xl pointer-events-none',
        sizes[size],
        colors[color],
        positions[position],
        animated && 'animate-blob',
        className
      )}
      {...props}
    />
  )
}

// Organic Shape Component for more complex decorations
export interface OrganicShapeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'blob1' | 'blob2' | 'blob3' | 'squiggle' | 'lightning'
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'gold' | 'purple'
}

const OrganicShape = ({
  className,
  variant = 'blob1',
  size = 'md',
  color = 'blue',
  ...props
}: OrganicShapeProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  }
  
  const colorClasses = {
    blue: 'text-electric-blue',
    green: 'text-energy-green', 
    gold: 'text-saiyan-gold',
    purple: 'text-deep-purple',
  }

  const shapes = {
    blob1: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <path
          d="M47.1,-57.1C59.9,-45.6,68.5,-28.9,71.4,-10.9C74.3,7.1,71.5,26.4,62.1,41.2C52.7,56,36.7,66.3,18.8,71.8C0.9,77.3,-18.9,77.9,-35.8,71.2C-52.7,64.5,-66.7,50.5,-74.1,33.8C-81.5,17.1,-82.3,-2.3,-76.8,-19.4C-71.3,-36.5,-59.5,-51.3,-44.7,-61.8C-29.9,-72.3,-12.1,-78.5,4.2,-83.5C20.5,-88.5,34.3,-68.6,47.1,-57.1Z"
          fill="currentColor"
          className="opacity-20"
        />
      </svg>
    ),
    blob2: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <path
          d="M36.5,-47.1C45.8,-37.2,50.9,-23.5,56.8,-7.6C62.7,8.3,69.4,26.4,66.6,40.9C63.8,55.4,51.5,66.3,36.8,71.8C22.1,77.3,5,77.4,-11.8,74.6C-28.6,71.8,-45.1,66.1,-56.2,54.4C-67.3,42.7,-72.9,25,-74.7,6.2C-76.5,-12.6,-74.5,-32.5,-65.8,-43.2C-57.1,-53.9,-41.7,-55.4,-27.8,-58.6C-13.9,-61.8,-1.5,-66.7,9.2,-68.2C19.9,-69.7,27.2,-57,36.5,-47.1Z"
          fill="currentColor"
          className="opacity-20"
        />
      </svg>
    ),
    blob3: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <path
          d="M44.3,-54.9C57.2,-43.8,67.4,-28.7,70.8,-11.9C74.2,4.9,70.8,23.4,61.4,37.8C52,52.2,36.6,62.5,19.8,68.1C3,73.7,-15.2,74.6,-30.7,69.2C-46.2,63.8,-59,52.1,-66.2,37.1C-73.4,22.1,-75,4.8,-71.8,-10.7C-68.6,-26.2,-60.6,-39.9,-49.1,-51.3C-37.6,-62.7,-22.6,-71.8,-6.1,-74.1C10.4,-76.4,31.4,-66,44.3,-54.9Z"
          fill="currentColor"
          className="opacity-20"
        />
      </svg>
    ),
    squiggle: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <path
          d="M20,50 Q50,20 80,50 T140,50 Q170,80 140,110 T80,110 Q50,140 80,170"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="opacity-30"
        />
      </svg>
    ),
    lightning: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <path
          d="M100,20 L80,80 L120,80 L90,160 L130,100 L110,100 L100,20 Z"
          fill="currentColor"
          className="opacity-30"
        />
      </svg>
    ),
  }

  return (
    <div
      className={cn(
        'absolute pointer-events-none animate-float',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      {...props}
    >
      {shapes[variant]}
    </div>
  )
}

export { BlobDecoration, OrganicShape }
