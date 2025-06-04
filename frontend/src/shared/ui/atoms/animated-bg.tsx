'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface AnimatedBgProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'blobs' | 'grid' | 'waves' | 'particles'
  intensity?: 'low' | 'medium' | 'high'
}

const AnimatedBg = ({ 
  className, 
  variant = 'blobs', 
  intensity = 'medium',
  children,
  ...props 
}: AnimatedBgProps) => {
  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      {/* Background Effects */}
      {variant === 'blobs' && <BlobBackground intensity={intensity} />}
      {variant === 'grid' && <GridBackground intensity={intensity} />}
      {variant === 'waves' && <WaveBackground intensity={intensity} />}
      {variant === 'particles' && <ParticleBackground intensity={intensity} />}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Blob Background Component
const BlobBackground = ({ intensity }: { intensity: string }) => {
  const intensityConfig = {
    low: { count: 2, scale: 'scale-75', opacity: 'opacity-20' },
    medium: { count: 3, scale: 'scale-100', opacity: 'opacity-30' },
    high: { count: 4, scale: 'scale-125', opacity: 'opacity-40' },
  }
  
  const config = intensityConfig[intensity as keyof typeof intensityConfig]
  
  return (
    <div className="absolute inset-0 -z-10">
      {Array.from({ length: config.count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'absolute rounded-full mix-blend-multiply filter blur-xl animate-blob',
            config.scale,
            config.opacity,
            i === 0 && 'top-0 left-0 bg-electric-blue animation-delay-0',
            i === 1 && 'top-0 right-0 bg-energy-green animation-delay-2000',
            i === 2 && 'bottom-0 left-0 bg-saiyan-gold animation-delay-4000',
            i === 3 && 'bottom-0 right-0 bg-deep-purple animation-delay-6000'
          )}
          style={{
            width: `${300 + i * 50}px`,
            height: `${300 + i * 50}px`,
          }}
        />
      ))}
    </div>
  )
}

// Grid Background Component  
const GridBackground = ({ intensity }: { intensity: string }) => {
  const gridSize = {
    low: 'bg-[length:60px_60px]',
    medium: 'bg-[length:40px_40px]', 
    high: 'bg-[length:20px_20px]',
  }
  
  return (
    <div 
      className={cn(
        'absolute inset-0 -z-10 opacity-10',
        'bg-[linear-gradient(to_right,#00E5FF_1px,transparent_1px),linear-gradient(to_bottom,#00E5FF_1px,transparent_1px)]',
        gridSize[intensity as keyof typeof gridSize]
      )}
    />
  )
}

// Wave Background Component
const WaveBackground = ({ intensity }: { intensity: string }) => {
  const waveIntensity = {
    low: 'opacity-20 scale-75',
    medium: 'opacity-30 scale-100',
    high: 'opacity-40 scale-125',
  }
  
  return (
    <div className="absolute inset-0 -z-10">
      <svg 
        className={cn('absolute inset-0 w-full h-full animate-wave', waveIntensity[intensity as keyof typeof waveIntensity])}
        viewBox="0 0 1200 800" 
        fill="none"
      >
        <path
          d="M0,400 C300,300 600,500 900,400 C1050,350 1200,400 1200,400 L1200,800 L0,800 Z"
          fill="url(#waveGradient1)"
        />
        <path
          d="M0,500 C300,400 600,600 900,500 C1050,450 1200,500 1200,500 L1200,800 L0,800 Z"
          fill="url(#waveGradient2)"
        />
        <defs>
          <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#39FF14" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#39FF14" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

// Particle Background Component
const ParticleBackground = ({ intensity }: { intensity: string }) => {
  const particleCount = {
    low: 15,
    medium: 25,
    high: 40,
  }
  
  const count = particleCount[intensity as keyof typeof particleCount]
  
  return (
    <div className="absolute inset-0 -z-10">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'absolute w-2 h-2 bg-electric-blue rounded-full opacity-30',
            'animate-float'
          )}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  )
}

export { AnimatedBg }
