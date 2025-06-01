'use client'

import { useProcessingSessions, useFrameResults } from '@/lib/supabase-hooks'
import { aiService } from '@/lib/ai-service'
import { useState } from 'react'

export default function ProcessingHistory() {
  const { sessions, loading, error } = useProcessingSessions()
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number): string => {
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'processing': return '🔄'
      case 'failed': return '❌'
      case 'created': return '📝'
      case 'uploaded': return '📤'
      default: return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--pico-color-green-500)'
      case 'processing': return 'var(--pico-color-blue-500)'
      case 'failed': return 'var(--pico-color-red-500)'
      default: return 'var(--pico-color-grey-500)'
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div aria-busy="true">Loading processing history...</div>
      </div>
    )
  }

  if (error) {
    return (
      <article style={{
        backgroundColor: 'var(--pico-color-red-50)',
        borderColor: 'var(--pico-color-red-200)',
        color: 'var(--pico-color-red-500)'
      }}>
        <header><strong>Error loading history</strong></header>
        <p>{error}</p>
      </article>
    )
  }

  if (sessions.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        backgroundColor: 'var(--pico-color-grey-50)',
        borderRadius: '8px'
      }}>
        <p style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>📋</p>
        <h3>No Processing History</h3>
        <p>Process your first video to see results here.</p>
      </div>
    )
  }

  return (
    <section>
      <h3>📊 Processing History ({sessions.length})</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            expanded={expandedSession === session.session_id}
            onToggle={() => setExpandedSession(
              expandedSession === session.session_id ? null : session.session_id
            )}
            formatDate={formatDate}
            formatFileSize={formatFileSize}
            formatTime={formatTime}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>
    </section>
  )
}

interface SessionCardProps {
  session: any
  expanded: boolean
  onToggle: () => void
  formatDate: (date: string) => string
  formatFileSize: (bytes: number) => string
  formatTime: (seconds: number) => string
  getStatusIcon: (status: string) => string
  getStatusColor: (status: string) => string
}

function SessionCard({
  session,
  expanded,
  onToggle,
  formatDate,
  formatFileSize,
  formatTime,
  getStatusIcon,
  getStatusColor
}: SessionCardProps) {
  const { results, loading: resultsLoading } = useFrameResults(expanded ? session.session_id : null)

  const handleDownloadFrame = async (frameIndex: number, downloadUrl: string) => {
    try {
      // Extract job_id from download_url
      const urlParts = downloadUrl.split('/')
      const jobId = urlParts[urlParts.length - 2]
      
      await aiService.triggerFrameDownload(jobId, frameIndex, `frame_${frameIndex + 1}.jpg`)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <article style={{ margin: 0 }}>
      <header 
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={onToggle}
      >
        <div>
          <h4 style={{ margin: 0 }}>
            {getStatusIcon(session.status)} {session.original_filename}
          </h4>
          <small style={{ color: getStatusColor(session.status) }}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)} • {formatDate(session.created_at)}
          </small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {session.frame_count && (
            <small>{session.frame_count} frame{session.frame_count > 1 ? 's' : ''}</small>
          )}
          <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>
      </header>

      {expanded && (
        <div style={{ paddingTop: '1rem' }}>
          {/* Session Details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <strong>File Info</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                <li>Size: {session.file_size ? formatFileSize(session.file_size) : 'Unknown'}</li>
                {session.duration && <li>Duration: {formatTime(session.duration)}</li>}
                {session.width && session.height && (
                  <li>Resolution: {session.width}×{session.height}</li>
                )}
                {session.fps && <li>FPS: {session.fps.toFixed(1)}</li>}
              </ul>
            </div>

            <div>
              <strong>Processing Settings</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                <li>Mode: {session.mode || 'Unknown'}</li>
                <li>Quality: {session.quality || 'Unknown'}</li>
                <li>Sample rate: {session.sample_rate || 'Unknown'}</li>
                {session.min_interval && <li>Min interval: {session.min_interval}s</li>}
              </ul>
            </div>

            <div>
              <strong>Status</strong>
              <p style={{ margin: '0.5rem 0' }}>
                <span style={{ color: getStatusColor(session.status) }}>
                  {getStatusIcon(session.status)} {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </p>
              {session.message && (
                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{session.message}</p>
              )}
              {session.error_message && (
                <p style={{ 
                  margin: '0.5rem 0', 
                  fontSize: '0.9rem',
                  color: 'var(--pico-color-red-500)'
                }}>
                  Error: {session.error_message}
                </p>
              )}
            </div>
          </div>

          {/* Frame Results */}
          {session.status === 'completed' && (
            <div>
              <strong>Frame Results</strong>
              {resultsLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <div aria-busy="true">Loading results...</div>
                </div>
              ) : results.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  {results.map((result) => (
                    <div
                      key={result.frame_index}
                      style={{
                        border: '1px solid var(--pico-color-grey-200)',
                        borderRadius: '4px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <strong>Frame {result.frame_index + 1}</strong>
                        <div style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: result.score >= 0.8 ? 'var(--pico-color-green-500)' : 
                                         result.score >= 0.6 ? 'var(--pico-color-yellow-500)' : 
                                         'var(--pico-color-orange-500)',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {(result.score * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                        <div>Time: {formatTime(result.timestamp)}</div>
                        <div>Size: {result.width}×{result.height}</div>
                        <div>File: {formatFileSize(result.file_size || 0)}</div>
                      </div>

                      {result.download_url && (
                        <button
                          onClick={() => handleDownloadFrame(result.frame_index, result.download_url)}
                          style={{ width: '100%', fontSize: '0.9rem' }}
                          className="outline"
                        >
                          📥 Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: '1rem 0', fontStyle: 'italic' }}>
                  No frame results found
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
