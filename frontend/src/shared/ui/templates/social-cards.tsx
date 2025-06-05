'use client'

import { HTMLAttributes } from 'react'
import { Logo } from '@/shared/ui/atoms/logo'
import { Card } from '@/shared/ui/molecules/card'
import { Button } from '@/shared/ui/atoms/button'
import { Badge } from '@/shared/ui/atoms/badge'
import { AnimatedBg } from '@/shared/ui/atoms/animated-bg'
import { BlobDecoration, OrganicShape } from '@/shared/ui/atoms/blob-decoration'
import { cn } from '@/shared/lib/utils'

// Instagram Story Template (1080x1920)
export const InstagramStoryTemplate = ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div 
    className="w-[1080px] h-[1920px] relative overflow-hidden bg-gradient-to-br from-void-black to-gray-900"
    {...props}
  >
    <AnimatedBg variant="blobs" intensity="medium" className="absolute inset-0">
      <BlobDecoration size="xl" color="gradient" position="top-right" className="opacity-20" />
      <BlobDecoration size="lg" color="blue" position="bottom-left" className="opacity-15" />
      
      <div className="relative z-10 p-16 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Logo variant="full" size="lg" />
          <Badge variant="success" size="lg">AI POWERED</Badge>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          {children}
        </div>
        
        {/* Footer CTA */}
        <div className="text-center">
          <p className="font-mono text-2xl text-electric-blue mb-6">framepicker.ai</p>
          <p className="font-mono text-lg text-gray-300">Swipe up to try free!</p>
        </div>
      </div>
    </AnimatedBg>
  </div>
)

// Twitter Card Template (1200x600)
export const TwitterCardTemplate = ({ title, description, ...props }: {
  title: string
  description: string
} & HTMLAttributes<HTMLDivElement>) => (
  <div 
    className="w-[1200px] h-[600px] relative overflow-hidden bg-gradient-to-r from-void-black via-gray-900 to-void-black"
    {...props}
  >
    <AnimatedBg variant="grid" intensity="low" className="absolute inset-0">
      <BlobDecoration size="xl" color="blue" position="top-left" className="opacity-10" />
      <BlobDecoration size="lg" color="green" position="bottom-right" className="opacity-15" />
      
      <div className="relative z-10 p-16 h-full flex items-center">
        <div className="flex-1">
          <Logo variant="full" size="xl" className="mb-8" />
          <h1 className="font-mono text-6xl font-bold text-pure-white mb-6 uppercase tracking-wide">
            {title}
          </h1>
          <p className="font-mono text-2xl text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="ml-16 relative">
          <OrganicShape variant="blob1" size="xl" color="gradient" className="opacity-30" />
          <div className="relative z-10 text-center">
            <div className="text-8xl mb-6">🎬</div>
            <Badge variant="info" size="lg">FREE TO TRY</Badge>
          </div>
        </div>
      </div>
    </AnimatedBg>
  </div>
)

// LinkedIn Post Template (1200x627)
export const LinkedInPostTemplate = ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div 
    className="w-[1200px] h-[627px] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
    {...props}
  >
    <AnimatedBg variant="waves" intensity="low" className="absolute inset-0">
      <BlobDecoration size="lg" color="blue" position="top-right" className="opacity-10" />
      
      <div className="relative z-10 p-12 h-full">
        <div className="bg-pure-white rounded-2xl border-4 border-void-black shadow-neo-xl p-12 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <Logo variant="full" size="lg" />
            <Badge variant="info" size="md">PROFESSIONAL TOOL</Badge>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {children}
          </div>
          
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-mono text-lg">framepicker.ai</span>
            <span className="font-mono text-sm">AI-Powered Frame Extraction</span>
          </div>
        </div>
      </div>
    </AnimatedBg>
  </div>
)

// YouTube Thumbnail Template (1280x720)
export const YouTubeThumbnailTemplate = ({ title, ...props }: {
  title: string
} & HTMLAttributes<HTMLDivElement>) => (
  <div 
    className="w-[1280px] h-[720px] relative overflow-hidden bg-gradient-to-br from-void-black to-deep-purple"
    {...props}
  >
    <AnimatedBg variant="particles" intensity="high" className="absolute inset-0">
      <BlobDecoration size="xl" color="gradient" position="center" className="opacity-20" />
      <OrganicShape variant="lightning" size="xl" color="gold" className="top-20 right-20 opacity-30" />
      
      <div className="relative z-10 p-16 h-full flex items-center">
        <div className="flex-1">
          <h1 className="font-mono text-7xl font-bold text-pure-white mb-8 uppercase tracking-wide leading-tight">
            {title}
          </h1>
          <div className="flex items-center gap-6">
            <Badge variant="success" size="lg">AI POWERED</Badge>
            <Badge variant="warning" size="lg">FREE TO TRY</Badge>
          </div>
        </div>
        
        <div className="ml-16 text-center">
          <Logo variant="icon" size="xl" animated />
          <p className="font-mono text-3xl text-electric-blue mt-6 font-bold">
            FRAME PICKER
          </p>
        </div>
      </div>
    </AnimatedBg>
  </div>
)

// TikTok Template (1080x1350)
export const TikTokTemplate = ({ hook, description, ...props }: {
  hook: string
  description: string
} & HTMLAttributes<HTMLDivElement>) => (
  <div 
    className="w-[1080px] h-[1350px] relative overflow-hidden bg-gradient-to-b from-void-black via-deep-purple to-void-black"
    {...props}
  >
    <AnimatedBg variant="blobs" intensity="high" className="absolute inset-0">
      <BlobDecoration size="xl" color="blue" position="top-left" className="opacity-30" />
      <BlobDecoration size="lg" color="green" position="bottom-right" className="opacity-25" />
      <OrganicShape variant="squiggle" size="lg" color="gold" className="top-1/3 right-10 opacity-40" />
      
      <div className="relative z-10 p-12 h-full flex flex-col">
        {/* Hook at top */}
        <div className="text-center mb-16">
          <h1 className="font-mono text-5xl font-bold text-pure-white uppercase tracking-wide leading-tight">
            {hook}
          </h1>
        </div>
        
        {/* Main visual area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="text-9xl mb-8">🎬</div>
          <Logo variant="full" size="xl" />
          <p className="font-mono text-3xl text-gray-300 mt-8 leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center">
          <Badge variant="success" size="lg" className="mb-4">TRY IT FREE</Badge>
          <p className="font-mono text-2xl text-electric-blue font-bold">
            framepicker.ai
          </p>
        </div>
      </div>
    </AnimatedBg>
  </div>
)

// Product Demo Card
export const ProductDemoCard = ({ step, title, description, ...props }: {
  step: number
  title: string
  description: string
} & HTMLAttributes<HTMLDivElement>) => (
  <Card variant="default" hover className="relative overflow-hidden p-8" {...props}>
    <BlobDecoration size="md" color="blue" position="top-right" className="opacity-15" />
    
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-electric-blue text-void-black font-mono font-bold text-xl flex items-center justify-center border-3 border-void-black">
          {step}
        </div>
        <h3 className="font-mono text-2xl font-bold text-void-black uppercase">
          {title}
        </h3>
      </div>
      
      <p className="font-mono text-lg text-gray-700 leading-relaxed">
        {description}
      </p>
    </div>
  </Card>
)

// Feature Highlight Card
export const FeatureCard = ({ icon, title, description, highlight, ...props }: {
  icon: string
  title: string
  description: string
  highlight?: boolean
} & HTMLAttributes<HTMLDivElement>) => (
  <Card 
    variant={highlight ? "processing" : "default"} 
    hover 
    className="relative overflow-hidden p-8" 
    {...props}
  >
    <BlobDecoration 
      size="lg" 
      color={highlight ? "green" : "blue"} 
      position="bottom-left" 
      className="opacity-20" 
    />
    
    <div className="relative z-10 text-center">
      <div className="text-6xl mb-6">{icon}</div>
      <h3 className={cn(
        "font-mono text-2xl font-bold uppercase mb-4",
        highlight ? "text-energy-green" : "text-void-black"
      )}>
        {title}
      </h3>
      <p className={cn(
        "font-mono text-lg leading-relaxed",
        highlight ? "text-gray-200" : "text-gray-700"
      )}>
        {description}
      </p>
      
      {highlight && (
        <Badge variant="success" size="md" className="mt-6">
          PRO FEATURE
        </Badge>
      )}
    </div>
  </Card>
)

// Email Header Template
export const EmailHeaderTemplate = ({ subject, ...props }: {
  subject: string
} & HTMLAttributes<HTMLDivElement>) => (
  <div 
    className="w-[600px] h-[200px] relative overflow-hidden bg-gradient-to-r from-void-black to-gray-900"
    {...props}
  >
    <AnimatedBg variant="grid" intensity="low" className="absolute inset-0">
      <BlobDecoration size="md" color="blue" position="top-left" className="opacity-20" />
      
      <div className="relative z-10 p-8 h-full flex items-center justify-between">
        <Logo variant="full" size="md" />
        <div className="text-right">
          <h1 className="font-mono text-2xl font-bold text-pure-white uppercase">
            {subject}
          </h1>
          <p className="font-mono text-sm text-electric-blue mt-2">
            framepicker.ai
          </p>
        </div>
      </div>
    </AnimatedBg>
  </div>
)

// Usage Examples for generating marketing assets
export const MarketingAssetExamples = () => (
  <div className="space-y-16 p-8">
    {/* Instagram Story Example */}
    <div>
      <h2 className="text-2xl font-bold mb-4">Instagram Story</h2>
      <InstagramStoryTemplate>
        <h1 className="font-mono text-6xl font-bold text-pure-white mb-8 uppercase">
          POV: YOU NEED THE PERFECT PROFILE PIC
        </h1>
        <div className="text-8xl mb-8">🤳</div>
        <p className="font-mono text-3xl text-gray-300 mb-12">
          But your videos have hidden gems...
        </p>
        <Badge variant="success" size="lg">AI FINDS THEM IN 3 SECONDS</Badge>
      </InstagramStoryTemplate>
    </div>

    {/* Twitter Card Example */}
    <div>
      <h2 className="text-2xl font-bold mb-4">Twitter Card</h2>
      <TwitterCardTemplate 
        title="STOP MANUAL SCREENSHOTS"
        description="AI extracts perfect frames from your videos in 3 seconds. Free to try."
      />
    </div>

    {/* Product Demo Cards */}
    <div>
      <h2 className="text-2xl font-bold mb-4">Product Demo Flow</h2>
      <div className="grid grid-cols-2 gap-8">
        <ProductDemoCard
          step={1}
          title="UPLOAD VIDEO"
          description="Drag and drop any video file. We support MP4, AVI, MOV, and WebM formats."
        />
        <ProductDemoCard
          step={2}
          title="AI ANALYSIS"
          description="Our advanced AI analyzes every frame for quality, composition, and clarity."
        />
        <ProductDemoCard
          step={3}
          title="PERFECT FRAMES"
          description="Get multiple high-quality options ready for any platform or purpose."
        />
        <ProductDemoCard
          step={4}
          title="INSTANT DOWNLOAD"
          description="Download professional-quality frames in seconds, not hours."
        />
      </div>
    </div>

    {/* Feature Cards */}
    <div>
      <h2 className="text-2xl font-bold mb-4">Feature Highlights</h2>
      <div className="grid grid-cols-3 gap-8">
        <FeatureCard
          icon="🎯"
          title="PROFILE MODE"
          description="Perfect for headshots and portrait-style content"
        />
        <FeatureCard
          icon="⚡"
          title="ACTION MODE"
          description="Captures intense moments and dynamic movement"
          highlight
        />
        <FeatureCard
          icon="🚀"
          title="3-SECOND PROCESSING"
          description="Lightning-fast AI analysis and frame extraction"
        />
      </div>
    </div>
  </div>
)