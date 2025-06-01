/**
 * AI Service API Client
 */

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export interface VideoInfo {
  filename: string
  duration?: number
  fps?: number
  width?: number
  height?: number
  frame_count?: number
}

export interface FrameResult {
  frame_index: number
  score: number
  timestamp: number
  width: number
  height: number
  file_size: number
}

export interface ProcessingResponse {
  job_id: string
  video_info: VideoInfo & { file_size: number }
  results: FrameResult[]
  processing_time: number
}

export interface ProcessingOptions {
  mode: 'profile' | 'action'
  quality: 'fast' | 'balanced' | 'best'
  count: number
  sample_rate: number
  min_interval: number
}

class AIServiceClient {
  private baseUrl: string

  constructor(baseUrl: string = AI_SERVICE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/health`)
    
    if (!response.ok) {
      throw new Error('AI Service is not available')
    }
    
    return response.json()
  }

  /**
   * Extract video information without processing
   */
  async extractVideoInfo(file: File): Promise<VideoInfo> {
    const formData = new FormData()
    formData.append('video', file)

    const response = await fetch(`${this.baseUrl}/extract-info`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || 'Failed to extract video info')
    }

    return response.json()
  }

  /**
   * Process video and extract best frames
   */
  async processVideo(
    file: File, 
    options: ProcessingOptions
  ): Promise<ProcessingResponse> {
    const formData = new FormData()
    formData.append('video', file)
    formData.append('mode', options.mode)
    formData.append('quality', options.quality)
    formData.append('count', options.count.toString())
    formData.append('sample_rate', options.sample_rate.toString())
    formData.append('min_interval', options.min_interval.toString())

    const response = await fetch(`${this.baseUrl}/process`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || 'Failed to process video')
    }

    return response.json()
  }

  /**
   * Get download URL for a processed frame
   */
  getFrameDownloadUrl(jobId: string, frameIndex: number): string {
    return `${this.baseUrl}/download/${jobId}/${frameIndex}`
  }

  /**
   * Download a frame as blob
   */
  async downloadFrame(jobId: string, frameIndex: number): Promise<Blob> {
    const response = await fetch(this.getFrameDownloadUrl(jobId, frameIndex))
    
    if (!response.ok) {
      throw new Error('Failed to download frame')
    }
    
    return response.blob()
  }

  /**
   * Trigger download in browser
   */
  async triggerFrameDownload(jobId: string, frameIndex: number, filename?: string): Promise<void> {
    try {
      const blob = await this.downloadFrame(jobId, frameIndex)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `frame_${frameIndex + 1}.jpg`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }

  /**
   * Download all frames from a job
   */
  async downloadAllFrames(jobId: string, frameCount: number): Promise<void> {
    const downloads = []
    
    for (let i = 0; i < frameCount; i++) {
      downloads.push(
        this.triggerFrameDownload(jobId, i, `frame_${i + 1}.jpg`)
      )
    }
    
    // Download all frames with slight delay between each
    for (let i = 0; i < downloads.length; i++) {
      await downloads[i]
      if (i < downloads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  /**
   * Clean up temporary files on AI service
   */
  async cleanupJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/cleanup/${jobId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      // Don't throw error for cleanup failures, just log
      console.warn('Failed to cleanup job:', jobId)
    }
  }
}

// Export singleton instance
export const aiService = new AIServiceClient()

// Export class for custom instances
export { AIServiceClient }
