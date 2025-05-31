'use client';

import { useState, useRef } from 'react';

export interface VideoUploadProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  disabled?: boolean;
}

export function VideoUpload({ onUpload, isUploading, disabled }: VideoUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isVideoFile(file)) {
        setSelectedFile(file);
        onUpload(file);
      } else {
        alert('Please select a video file (MP4, AVI, MOV, WebM)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isVideoFile(file)) {
        setSelectedFile(file);
        onUpload(file);
      } else {
        alert('Please select a video file (MP4, AVI, MOV, WebM)');
      }
    }
  };

  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-container">
      <h2>Upload Your Video</h2>
      
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: dragOver ? '#f0f8ff' : '#fafafa',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {isUploading ? (
          <div>
            <p>📤 Uploading...</p>
            <progress />
          </div>
        ) : selectedFile ? (
          <div>
            <p>✅ File selected: {selectedFile.name}</p>
            <p>Size: {formatFileSize(selectedFile.size)}</p>
            <small>Click to select a different file</small>
          </div>
        ) : (
          <div>
            <p>🎬 Drop your video here or click to select</p>
            <p>Supports: MP4, AVI, MOV, WebM</p>
            <p>Max size: 100MB</p>
          </div>
        )}
      </div>

      {selectedFile && !isUploading && (
        <div style={{ marginTop: '1rem' }}>
          <details>
            <summary>File Details</summary>
            <ul>
              <li><strong>Name:</strong> {selectedFile.name}</li>
              <li><strong>Type:</strong> {selectedFile.type}</li>
              <li><strong>Size:</strong> {formatFileSize(selectedFile.size)}</li>
              <li><strong>Last Modified:</strong> {new Date(selectedFile.lastModified).toLocaleString()}</li>
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}