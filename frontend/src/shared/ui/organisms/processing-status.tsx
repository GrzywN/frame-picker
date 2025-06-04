'use client'

import { Card, CardHeader, CardTitle, CardContent } from '../molecules/card'
import { Badge } from '../atoms/badge'
import { Progress } from '../atoms/progress'
import { cn } from '@/shared/lib/utils'

export interface ProcessingStatusProps {
  status: {
    session_id: string
    status: string
    message: string
    progress: number
    results?: any[]
    error?: string
  } | null
  sessionId: string | null
  className?: string
}

const ProcessingStatus = ({ status, sessionId, className }: ProcessingStatusProps) => {
  if (!status || !sessionId) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return '📝'
      case 'uploaded': return '📤'
      case 'processing': return '⚙️'
      case 'completed': return '✅'
      case 'failed': return '❌'
      default: return '❓'
    }
  }

  const getStatusVariant = (status: string): 'success' | 'error' | 'processing' | 'warning' | 'info' => {
    switch (status) {
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'processing': return 'processing'
      case 'uploaded': return 'warning'
      default: return 'info'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Card variant={status.status === 'processing' ? 'processing' : 'default'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">{getStatusIcon(status.status)}</span>
              PROCESSING STATUS
            </CardTitle>
            <Badge variant={getStatusVariant(status.status)} size="md">
              {status.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="font-mono text-body">
            {status.message}
          </p>

          {/* Progress Bar for Processing */}
          {status.status === 'processing' && (
            <div className="space-y-2">
              <Progress 
                value={status.progress} 
                showLabel 
                size="md"
              />
              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-energy-green border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono text-small text-energy-green font-bold">
                    PROCESSING...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {status.error && (
            <Card variant="default" className="bg-warning-orange/10 border-warning-orange">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-mono font-bold text-warning-orange uppercase mb-2">
                      ERROR DETAILS
                    </h4>
                    <p className="font-mono text-small text-void-black">
                      {status.error}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Session Details */}
      <Card variant="dark" hover>
        <CardHeader>
          <CardTitle className="text-electric-blue">
            SESSION DETAILS
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-caption">
            <div>
              <span className="text-gray-700">SESSION ID:</span>
              <br />
              <code className="text-electric-blue bg-gray-700 px-2 py-1 rounded">
                {sessionId.slice(0, 8)}...
              </code>
            </div>
            
            <div>
              <span className="text-gray-700">STATUS:</span>
              <br />
              <span className="text-pure-white font-bold uppercase">
                {status.status}
              </span>
            </div>
            
            <div>
              <span className="text-gray-700">PROGRESS:</span>
              <br />
              <span className="text-energy-green font-bold">
                {status.progress}%
              </span>
            </div>
            
            {status.results && (
              <div>
                <span className="text-gray-700">RESULTS:</span>
                <br />
                <span className="text-saiyan-gold font-bold">
                  {status.results.length} FRAME(S)
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { ProcessingStatus }
