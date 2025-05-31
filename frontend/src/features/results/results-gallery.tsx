'use client';

import { FrameResult } from '@/lib/api';

export interface ResultsGalleryProps {
  results: FrameResult[];
  sessionId: string;
  onDownload: (sessionId: string, frameIndex: number, filename?: string) => void;
}

export function ResultsGallery({ results, sessionId, onDownload }: ResultsGalleryProps) {
  if (results.length === 0) {
    return null;
  }

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return '#28a745';
    if (score >= 0.6) return '#ffc107';
    return '#fd7e14';
  };

  const handleDownload = (frameIndex: number) => {
    const filename = `frame_${frameIndex + 1}.jpg`;
    onDownload(sessionId, frameIndex, filename);
  };

  const handleDownloadAll = () => {
    results.forEach((_, index) => {
      setTimeout(() => {
        handleDownload(index);
      }, index * 500); // Stagger downloads
    });
  };

  return (
    <div className="results-gallery">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🎯 Best Frames Found</h2>
        {results.length > 1 && (
          <button onClick={handleDownloadAll} className="outline">
            📥 Download All
          </button>
        )}
      </header>

      <p>Found {results.length} high-quality frame{results.length > 1 ? 's' : ''} from your video.</p>

      <div className="gallery-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {results.map((result, index) => (
          <article key={result.frame_index} className="frame-card">
            <header>
              <h3>Frame {result.frame_index + 1}</h3>
              <div style={{ 
                display: 'inline-block',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: getScoreColor(result.score),
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                Score: {(result.score * 100).toFixed(0)}%
              </div>
            </header>

            {/* Frame Preview */}
            <div style={{ 
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              {result.download_url ? (
                <img
                  src={`http://localhost:8000${result.download_url}`}
                  alt={`Frame ${result.frame_index + 1}`}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '4px'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling!.style.display = 'block';
                  }}
                />
              ) : null}
              <div style={{ display: 'none' }}>
                🖼️ Preview not available
              </div>
            </div>

            {/* Frame Metadata */}
            <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>Time:</strong> {formatTimestamp(result.timestamp)}</div>
                <div><strong>Score:</strong> {result.score.toFixed(3)}</div>
                {result.width && result.height && (
                  <>
                    <div><strong>Size:</strong> {result.width}×{result.height}</div>
                    <div><strong>File:</strong> {formatFileSize(result.file_size)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Download Button */}
            <button 
              onClick={() => handleDownload(result.frame_index)}
              style={{ width: '100%' }}
            >
              📥 Download Frame
            </button>
          </article>
        ))}
      </div>

      {/* Free Tier Notice */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        fontSize: '0.9rem'
      }}>
        <strong>🆓 Free Tier:</strong> Images include watermark and are limited to 720p quality. 
        <a href="#upgrade" style={{ marginLeft: '0.5rem' }}>Upgrade for HD quality and no watermark →</a>
      </div>
    </div>
  );
}