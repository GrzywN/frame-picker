'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Card } from '../molecules/card'
import { Badge } from '../atoms/badge'
import { Progress } from '../atoms/progress'

export interface UploadZoneProps {
  onUpload: (file: File) => void
  isUploading?: boolean
  uploadProgress?: number
  disabled?: boolean
  acceptedTypes?: string[]
  maxSize?: number
  className?: string
}

const UploadZone = ({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
  disabled = false,
  acceptedTypes = ['video/*'],
  maxSize = 100 * 1024 * 1024, // 100MB
  className,
}: UploadZoneProps) => {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isValidFile = (file: File): boolean => {
    return acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    }) && file.size <= maxSize
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (isValidFile(file)) {
        setSelectedFile(file)
        onUpload(file)
      } else {
        alert(`Invalid file. Please select a file that matches: ${acceptedTypes.join(', ')} and is under ${formatFileSize(maxSize)}`)
      }
    }
  }, [disabled, acceptedTypes, maxSize, onUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (isValidFile(file)) {
        setSelectedFile(file)
        onUpload(file)
      } else {
        alert(`Invalid file. Please select a file that matches: ${acceptedTypes.join(', ')} and is under ${formatFileSize(maxSize)}`)
      }
    }
  }, [acceptedTypes, maxSize, onUpload])

  const handleClick = () => {
    if (!disabled) {
      document.getElementById('file-input')?.click()
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h2 className="font-mono text-h2 font-bold text-void-black uppercase tracking-wide mb-2">
          UPLOAD YOUR VIDEO
        </h2>
        <p className="font-mono text-body text-gray-700">
          Drag & drop or click to select your video file
        </p>
      </div>

      <Card
        variant="default"
        hover={!disabled && !isUploading}
        className={cn(
          'cursor-pointer transition-all duration-200',
          'border-dashed border-electric-blue',
          dragOver && !disabled && 'bg-electric-blue text-pure-white border-solid scale-105',
          disabled && 'opacity-60 cursor-not-allowed',
          isUploading && 'cursor-wait'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        data-testid="upload-zone"
      >
        <input
          id="file-input"
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center py-8">
          {isUploading ? (
            <div className="space-y-4">
              <div className="text-6xl">📤</div>
              <div>
                <p className="font-mono text-h3 font-bold uppercase">UPLOADING...</p>
                <Progress value={uploadProgress} showLabel className="mt-4" />
              </div>
            </div>
          ) : selectedFile ? (
            <div className="space-y-4">
              <div className="text-6xl">✅</div>
              <div>
                <p className="font-mono text-h3 font-bold uppercase text-energy-green">
                  FILE SELECTED
                </p>
                <p className="font-mono text-body mt-2">{selectedFile.name}</p>
                <p className="font-mono text-small text-gray-700">
                  {formatFileSize(selectedFile.size)}
                </p>
                <p className="font-mono text-caption text-gray-700 mt-2">
                  Click to select a different file
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">🎬</div>
              <div>
                <p className="font-mono text-h3 font-bold uppercase">
                  DROP YOUR VIDEO HERE
                </p>
                <p className="font-mono text-body text-gray-700 mt-2">
                  or click to browse files
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge variant="info" size="sm">MP4</Badge>
                  <Badge variant="info" size="sm">AVI</Badge>
                  <Badge variant="info" size="sm">MOV</Badge>
                  <Badge variant="info" size="sm">WEBM</Badge>
                </div>
                <p className="font-mono text-caption text-gray-700 mt-2">
                  Max size: {formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {selectedFile && !isUploading && (
        <Card variant="dark" className="space-y-3">
          <h3 className="font-mono text-small font-bold uppercase text-electric-blue">
            FILE DETAILS
          </h3>
          <div className="grid grid-cols-2 gap-4 font-mono text-caption">
            <div>
              <span className="text-gray-700">NAME:</span>
              <br />
              <span className="text-pure-white">{selectedFile.name}</span>
            </div>
            <div>
              <span className="text-gray-700">TYPE:</span>
              <br />
              <span className="text-pure-white">{selectedFile.type}</span>
            </div>
            <div>
              <span className="text-gray-700">SIZE:</span>
              <br />
              <span className="text-pure-white">{formatFileSize(selectedFile.size)}</span>
            </div>
            <div>
              <span className="text-gray-700">MODIFIED:</span>
              <br />
              <span className="text-pure-white">
                {new Date(selectedFile.lastModified).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export { UploadZone }
