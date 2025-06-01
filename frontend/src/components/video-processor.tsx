'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { aiService, ProcessingOptions, ProcessingResponse } from '@/lib/ai-service'
import { supabase } from '@/lib/supabase'

type ProcessingStep = 'upload' | 'configure' | 'processing' | 'completed'

export default function VideoProcessor() {
  const { user, profile } = useAuth()
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [processingResult, setProcessingResult] = useState<ProcessingResponse | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Processing options
  const [options, setOptions] = useState<ProcessingOptions>({
    mode: 'profile',
    quality: 'balanced',
    count: 1,
    sample_rate: 30,
    min_interval: 2.0
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    setError(null)

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file (MP4, MOV, AVI, WebM)')
      return
    }

    // Check file size based on user tier
    const maxSize = profile?.current_tier === 'pro' ? 500 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      setError(`File size exceeds ${maxSizeMB}MB limit for your current plan`)
      return
    }

    try {
      // Quick video info extraction
      const videoInfo = await aiService.extractVideoInfo(file)
      console.log('Video info:', videoInfo)
      
      setSelectedFile(file)
      setCurrentStep('configure')
    } catch (err) {
      console.error('Error extracting video info:', err)
      setError(err instanceof Error ? err.message : 'Failed to process video file')
    }
  }

  const handleStartProcessing = async () => {
    if (!selectedFile || !user) return

    setProcessing(true)
    setError(null)

    try {
      // Create session in Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('processing_sessions')
        .insert({
          user_id: user.id,
          session_id: crypto.randomUUID(),
          status: 'created',
          message: 'Initializing processing...',
          original_filename: selectedFile.name,
          file_size: selectedFile.size,
          mode: options.mode,
          quality: options.quality,
          frame_count: options.count,
          sample_rate: options.sample_rate,
          min_interval: options.min_interval
        })
        .select()
        .single()

      if (sessionError) {
        throw new Error('Failed to create processing session')
      }

      setSessionId(sessionData.session_id)
      setCurrentStep('processing')

      // Update session status
      await supabase
        .from('processing_sessions')
        .update({ 
          status: 'processing',
          message: 'Processing video with AI...'
        })
        .eq('session_id', sessionData.session_id)

      // Call AI service
      const result = await aiService.processVideo(selectedFile, options)
      setProcessingResult(result)

      // Save results to database
      const frameResults = result.results.map(frame => ({
        session_id: sessionData.id,
        frame_index: frame.frame_index,
        score: frame.score,
        timestamp: frame.timestamp,
        file_size: frame.file_size,
        width: frame.width,
        height: frame.height,
        download_url: aiService.getFrameDownloadUrl(result.job_id, frame.frame_index)
      }))

      await supabase
        .from('frame_results')
        .insert(frameResults)

      // Update session as completed
      await supabase
        .from('processing_sessions')
        .update({
          status: 'completed',
          message: `Processing completed! Found ${result.results.length} high-quality frames.`,
          progress: 100,
          duration: result.video_info.duration,
          fps: result.video_info.fps,
          width: result.video_info.width,
          height: result.video_info.height
        })
        .eq('session_id', sessionData.session_id)

      // TODO: Update user usage tracking

      setCurrentStep('completed')

    } catch (err) {
      console.error('Processing error:', err)
      setError(err instanceof Error ? err.message : 'Processing failed')
      
      // Update session with error
      if (sessionId) {
        await supabase
          .from('processing_sessions')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Processing failed'
          })
          .eq('session_id', sessionId)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleDownloadFrame = async (frameIndex: number) => {
    if (!processingResult) return

    try {
      await aiService.triggerFrameDownload(
        processingResult.job_id,
        frameIndex,
        `frame_${frameIndex + 1}.jpg`
      )
    } catch (err) {
      console.error('Download failed:', err)
      setError('Failed to download frame')
    }
  }

  const handleDownloadAll = async () => {
    if (!processingResult) return

    try {
      await aiService.downloadAllFrames(processingResult.job_id, processingResult.results.length)
    } catch (err) {
      console.error('Download all failed:', err)
      setError('Failed to download frames')
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setProcessingResult(null)
    setSessionId(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <section>
      {/* Progress indicator */}
      <div style={{ marginBottom: '2rem' }}>
        <nav aria-label="progress">
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            gap: '1rem',
            justifyContent: 'center',
            padding: 0,
            margin: 0
          }}>
            {[
              { step: 'upload', label: '1️⃣ Upload', active: currentStep === 'upload' },
              { step: 'configure', label: '2️⃣ Configure', active: currentStep === 'configure' },
              { step: 'processing', label: '3️⃣ Processing', active: currentStep === 'processing' },
              { step: 'completed', label: '4️⃣ Results', active: currentStep === 'completed' }
            ].map(({ step, label, active }) => (
              <li key={step}>
                <span style={{
                  fontWeight: active ? 'bold' : 'normal',
                  opacity: active ? 1 : 0.6
                }}>
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Error display */}
      {error && (
        <article style={{
          backgroundColor: 'var(--pico-color-red-50)',
          borderColor: 'var(--pico-color-red-200)',
          color: 'var(--pico-color-red-500)',
          marginBottom: '2rem'
        }}>
          <header><strong>❌ Error</strong></header>
          <p>{error}</p>
          <footer>
            <button onClick={() => setError(null)} className="outline">
              Dismiss
            </button>
          </footer>
        </article>
      )}

      {/* Step 1: Upload */}
      {currentStep === 'upload' && (
        <article>
          <header>
            <h3>📤 Upload Your Video</h3>
          </header>

          <div
            style={{
              border: `2px dashed ${dragOver ? 'var(--pico-color-azure-500)' : 'var(--pico-color-grey-300)'}`,
              borderRadius: '8px',
              padding: '3rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragOver ? 'var(--pico-color-azure-50)' : 'var(--pico-color-grey-50)',
              transition: 'all 0.2s ease'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            <div>
              <p style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>🎬</p>
              <p><strong>Drop your video here or click to select</strong></p>
              <p><small>Supports: MP4, MOV, AVI, WebM</small></p>
              <p><small>
                Max size: {profile?.current_tier === 'pro' ? '500MB' : '50MB'} 
                {profile?.current_tier === 'free' && (
                  <> • <a href="#billing">Upgrade for larger files</a></>
                )}
              </small></p>
            </div>
          </div>

          <footer style={{ marginTop: '1rem' }}>
            <details>
              <summary>Plan Limits</summary>
              <ul>
                <li><strong>Free:</strong> 3 videos/month, 3 frames each, 720p, 50MB limit</li>
                <li><strong>Pro:</strong> 100 videos/month, 10 frames each, 1080p, 500MB limit</li>
              </ul>
            </details>
          </footer>
        </article>
      )}

      {/* Step 2: Configure */}
      {currentStep === 'configure' && selectedFile && (
        <article>
          <header>
            <h3>⚙️ Processing Options</h3>
          </header>

          {/* File info */}
          <div style={{ 
            backgroundColor: 'var(--pico-color-green-50)', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '2rem'
          }}>
            <p><strong>✅ File selected:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
          </div>

          <div className="grid">
            {/* Mode */}
            <div>
              <label>
                Mode
                <select
                  value={options.mode}
                  onChange={(e) => setOptions(prev => ({ ...prev, mode: e.target.value as 'profile' | 'action' }))}
                >
                  <option value="profile">Profile (Face-focused)</option>
                  <option value="action">Action (Activity-focused)</option>
                </select>
              </label>
              <small>
                {options.mode === 'profile' 
                  ? 'Best for headshots and profile pictures' 
                  : 'Best for sports and action shots'}
              </small>
            </div>

            {/* Quality */}
            <div>
              <label>
                Quality
                <select
                  value={options.quality}
                  onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value as 'fast' | 'balanced' | 'best' }))}
                >
                  <option value="fast">Fast</option>
                  <option value="balanced">Balanced</option>
                  <option value="best">Best</option>
                </select>
              </label>
              <small>Higher quality takes longer to process</small>
            </div>
          </div>

          <div className="grid">
            {/* Frame count */}
            <div>
              <label>
                Number of Frames
                <input
                  type="number"
                  min="1"
                  max={profile?.current_tier === 'pro' ? 10 : 3}
                  value={options.count}
                  onChange={(e) => setOptions(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                />
              </label>
              <small>Max: {profile?.current_tier === 'pro' ? '10' : '3'} frames</small>
            </div>

            {/* Sample rate */}
            <div>
              <label>
                Sample Rate
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={options.sample_rate}
                  onChange={(e) => setOptions(prev => ({ ...prev, sample_rate: parseInt(e.target.value) }))}
                />
              </label>
              <small>Analyze every Nth frame (lower = more thorough)</small>
            </div>
          </div>

          {options.count > 1 && (
            <div>
              <label>
                Minimum Interval (seconds)
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={options.min_interval}
                  onChange={(e) => setOptions(prev => ({ ...prev, min_interval: parseFloat(e.target.value) }))}
                />
              </label>
              <small>Minimum time between selected frames</small>
            </div>
          )}

          <footer style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleReset} className="secondary outline">
              ← Back
            </button>
            <button 
              onClick={handleStartProcessing}
              disabled={processing}
              aria-busy={processing}
            >
              {processing ? 'Starting...' : '🚀 Start Processing'}
            </button>
          </footer>
        </article>
      )}

      {/* Step 3: Processing */}
      {currentStep === 'processing' && (
        <article>
          <header>
            <h3>🔄 Processing Video</h3>
          </header>

          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div aria-busy="true" style={{ marginBottom: '1rem' }}>
              Analyzing your video with AI...
            </div>
            <p>This may take a few moments depending on video length and quality settings.</p>
          </div>
        </article>
      )}

      {/* Step 4: Results */}
      {currentStep === 'completed' && processingResult && (
        <article>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🎯 Results ({processingResult.results.length} frames)</h3>
            {processingResult.results.length > 1 && (
              <button onClick={handleDownloadAll} className="outline">
                📥 Download All
              </button>
            )}
          </header>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {processingResult.results.map((result, index) => (
              <article key={result.frame_index} style={{ margin: 0 }}>
                <header>
                  <h4>Frame {result.frame_index + 1}</h4>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: result.score >= 0.8 ? 'var(--pico-color-green-500)' : 
                                   result.score >= 0.6 ? 'var(--pico-color-yellow-500)' : 
                                   'var(--pico-color-orange-500)',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    Score: {(result.score * 100).toFixed(0)}%
                  </div>
                </header>

                {/* Frame preview placeholder */}
                <div style={{
                  backgroundColor: 'var(--pico-color-grey-100)',
                  border: '1px solid var(--pico-color-grey-200)',
                  borderRadius: '4px',
                  padding: '2rem',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  <p>🖼️ Frame Preview</p>
                  <small>{result.width} × {result.height}</small>
                </div>

                <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><strong>Time:</strong> {formatTime(result.timestamp)}</div>
                    <div><strong>Score:</strong> {result.score.toFixed(3)}</div>
                    <div><strong>Size:</strong> {result.width}×{result.height}</div>
                    <div><strong>File:</strong> {formatFileSize(result.file_size)}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadFrame(result.frame_index)}
                  style={{ width: '100%' }}
                >
                  📥 Download Frame
                </button>
              </article>
            ))}
          </div>

          <footer style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleReset} className="secondary outline">
              🔄 Process Another Video
            </button>
          </footer>

          {/* Processing stats */}
          <details style={{ marginTop: '2rem' }}>
            <summary>Processing Details</summary>
            <ul>
              <li><strong>Processing time:</strong> {processingResult.processing_time.toFixed(2)}s</li>
              <li><strong>Video duration:</strong> {processingResult.video_info.duration ? formatTime(processingResult.video_info.duration) : 'Unknown'}</li>
              <li><strong>Resolution:</strong> {processingResult.video_info.width}×{processingResult.video_info.height}</li>
              <li><strong>Frame rate:</strong> {processingResult.video_info.fps?.toFixed(1)} fps</li>
            </ul>
          </details>
        </article>
      )}
    </section>
  )
}
