'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../molecules/card'
import { Button } from '../atoms/button'
import { Badge } from '../atoms/badge'
import { cn } from '@/shared/lib/utils'

export interface FrameResult {
  frame_index: number
  score: number
  timestamp: number
  file_path?: string
  download_url?: string
  width?: number
  height?: number
  file_size?: number
}

export interface ResultsGalleryProps {
  results: FrameResult[]
  sessionId: string
  onDownload: (sessionId: string, frameIndex: number, filename?: string) => void
  className?: string
}

const ResultsGallery = ({ 
  results, 
  sessionId, 
  onDownload, 
  className 
}: ResultsGalleryProps) => {
  if (results.length === 0) {
    return null
  }

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getScoreVariant = (score: number): 'success' | 'warning' | 'info' => {
    if (score >= 0.8) return 'success'
    if (score >= 0.6) return 'warning'
    return 'info'
  }

  const handleDownload = (frameIndex: number) => {
    const filename = `frame_${frameIndex + 1}.jpg`
    onDownload(sessionId, frameIndex, filename)
  }

  const handleDownloadAll = () => {
    results.forEach((_, index) => {
      setTimeout(() => {
        handleDownload(index)
      }, index * 500) // Stagger downloads
    })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-mono text-h2 font-bold text-void-black uppercase tracking-wide flex items-center gap-3">
            🎯 BEST FRAMES FOUND
          </h2>
          <p className="font-mono text-body text-gray-700 mt-2">
            Found {results.length} high-quality frame{results.length > 1 ? 's' : ''} from your video
          </p>
        </div>
        
        {results.length > 1 && (
          <Button 
            variant="primary" 
            size="md"
            onClick={handleDownloadAll}
            className="flex items-center gap-2"
          >
            📥 DOWNLOAD ALL
          </Button>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <Card 
            key={result.frame_index} 
            variant="default" 
            hover
            className="overflow-hidden"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-h3">
                  FRAME {result.frame_index + 1}
                </CardTitle>
                <Badge 
                  variant={getScoreVariant(result.score)}
                  size="md"
                >
                  {(result.score * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardHeader>

            {/* Frame Preview */}
            <div className="relative bg-gray-100 border-3 border-void-black mx-6 mb-4 min-h-[200px] flex items-center justify-center">
              {result.download_url ? (
                <img
                  src={`http://localhost:8000${result.download_url}`}
                  alt={`Frame ${result.frame_index + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="text-center p-8">
                          <div class="text-4xl mb-2">🖼️</div>
                          <p class="font-mono text-small text-gray-700">Preview not available</p>
                        </div>
                      `
                    }
                  }}
                />
              ) : (
                <div className="text-center p-8">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="font-mono text-small text-gray-700">Preview not available</p>
                </div>
              )}
            </div>

            <CardContent className="space-y-3">
              {/* Frame Metadata */}
              <div className="grid grid-cols-2 gap-2 font-mono text-caption">
                <div>
                  <span className="text-gray-700 font-medium">TIME:</span>
                  <br />
                  <span className="text-void-black font-bold">
                    {formatTimestamp(result.timestamp)}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-700 font-medium">SCORE:</span>
                  <br />
                  <span className="text-void-black font-bold">
                    {result.score.toFixed(3)}
                  </span>
                </div>
                
                {result.width && result.height && (
                  <>
                    <div>
                      <span className="text-gray-700 font-medium">SIZE:</span>
                      <br />
                      <span className="text-void-black font-bold">
                        {result.width}×{result.height}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-700 font-medium">FILE:</span>
                      <br />
                      <span className="text-void-black font-bold">
                        {formatFileSize(result.file_size)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                variant="primary" 
                size="md"
                onClick={() => handleDownload(result.frame_index)}
                className="w-full flex items-center justify-center gap-2"
              >
                📥 DOWNLOAD FRAME
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Free Tier Notice */}
      <Card variant="default" className="bg-saiyan-gold/10 border-saiyan-gold">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🆓</span>
            <div>
              <h3 className="font-mono font-bold text-void-black uppercase mb-2">
                FREE TIER NOTICE
              </h3>
              <p className="font-mono text-body text-void-black mb-3">
                Images include watermark and are limited to 720p quality.
              </p>
              <Button variant="secondary" size="sm">
                ⬆️ UPGRADE FOR HD QUALITY
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { ResultsGallery }
