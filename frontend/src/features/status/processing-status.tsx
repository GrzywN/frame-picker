'use client';

import { SessionStatus } from '@/lib/api';

export interface ProcessingStatusProps {
  status: SessionStatus | null;
  sessionId: string | null;
}

export function ProcessingStatus({ status, sessionId }: ProcessingStatusProps) {
  if (!status || !sessionId) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return '📝';
      case 'uploaded': return '📤';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return '#007bff';
      case 'completed': return '#28a745';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="processing-status">
      <h2>Processing Status</h2>
      
      <article>
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(status.status)}</span>
            <span style={{ 
              color: getStatusColor(status.status),
              textTransform: 'capitalize',
              fontWeight: 'bold'
            }}>
              {status.status}
            </span>
          </div>
        </header>

        <p>{status.message}</p>

        {/* Progress Bar for Processing */}
        {status.status === 'processing' && (
          <div>
            <progress value={status.progress} max="100" />
            <small>{status.progress}% complete</small>
          </div>
        )}

        {/* Session Info */}
        <details>
          <summary>Session Details</summary>
          <ul>
            <li><strong>Session ID:</strong> <code>{sessionId}</code></li>
            <li><strong>Status:</strong> {status.status}</li>
            <li><strong>Progress:</strong> {status.progress}%</li>
            {status.results && (
              <li><strong>Results:</strong> {status.results.length} frame(s) found</li>
            )}
          </ul>
        </details>

        {/* Error Display */}
        {status.error && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24'
          }}>
            <strong>Error:</strong> {status.error}
          </div>
        )}
      </article>
    </div>
  );
}