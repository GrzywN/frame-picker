'use client';

import { useState } from 'react';
import { ProcessRequest } from '@/lib/api';

export interface ProcessingOptionsProps {
  onProcess: (options: ProcessRequest) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export function ProcessingOptions({ onProcess, isProcessing, disabled }: ProcessingOptionsProps) {
  const [options, setOptions] = useState<ProcessRequest>({
    mode: 'profile',
    quality: 'balanced',
    count: 1,
    sample_rate: 30,
    min_interval: 2.0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProcess(options);
  };

  const handleChange = (field: keyof ProcessRequest, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="processing-options">
      <h2>Processing Options</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid">
          {/* Mode Selection */}
          <div>
            <label>
              Mode
              <select
                value={options.mode}
                onChange={(e) => handleChange('mode', e.target.value)}
                disabled={disabled}
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

          {/* Quality Selection */}
          <div>
            <label>
              Quality
              <select
                value={options.quality}
                onChange={(e) => handleChange('quality', e.target.value)}
                disabled={disabled}
              >
                <option value="fast">Fast (Quick processing)</option>
                <option value="balanced">Balanced (Recommended)</option>
                <option value="best">Best (Highest quality)</option>
              </select>
            </label>
            <small>Higher quality takes longer to process</small>
          </div>
        </div>

        <div className="grid">
          {/* Frame Count */}
          <div>
            <label>
              Number of Frames
              <input
                type="number"
                min="1"
                max="10"
                value={options.count}
                onChange={(e) => handleChange('count', parseInt(e.target.value))}
                disabled={disabled}
              />
            </label>
            <small>How many best frames to extract (1-10)</small>
          </div>

          {/* Sample Rate */}
          <div>
            <label>
              Sample Rate
              <input
                type="number"
                min="1"
                max="60"
                value={options.sample_rate}
                onChange={(e) => handleChange('sample_rate', parseInt(e.target.value))}
                disabled={disabled}
              />
            </label>
            <small>Extract every Nth frame (lower = more thorough)</small>
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
                onChange={(e) => handleChange('min_interval', parseFloat(e.target.value))}
                disabled={disabled}
              />
            </label>
            <small>Minimum time between selected frames</small>
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || isProcessing}
          className={isProcessing ? 'secondary' : 'primary'}
        >
          {isProcessing ? '🔄 Processing...' : '🚀 Start Processing'}
        </button>
      </form>

      {/* Processing Info */}
      {isProcessing && (
        <article style={{ marginTop: '1rem' }}>
          <header>Processing Your Video</header>
          <p>This may take a few moments depending on video length and quality settings.</p>
          <progress />
        </article>
      )}
    </div>
  );
}