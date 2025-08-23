<?php

namespace App\Models;

use App\Enums\Status;
use Database\Factories\ProcessingSessionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;

/**
 * 
 *
 * @property string $id
 * @property string $filename
 * @property string $file_path
 * @property string $mime_type
 * @property int $file_size
 * @property Status $status
 * @property int $progress
 * @property string|null $message
 * @property \Illuminate\Support\Carbon|null $started_at
 * @property \Illuminate\Support\Carbon|null $completed_at
 * @property string|null $mode
 * @property string|null $quality
 * @property int|null $count
 * @property int|null $sample_rate
 * @property int|null $frame_count
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Database\Factories\ProcessingSessionFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereCompletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereFileSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereFrameCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereMimeType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereMode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereProgress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereQuality($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereSampleRate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereStartedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ProcessingSession whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class ProcessingSession extends Model
{
    /** @use HasFactory<ProcessingSessionFactory> */
    use HasFactory;
    use HasUuids;

    protected $keyType = 'string';

    protected $fillable = [
        'filename',
        'file_path',
        'mime_type',
        'file_size',
        'status',
        'progress',
        'message',
        'started_at',
        'completed_at',
        'mode',
        'quality',
        'count',
        'sample_rate',
        'frame_count',
    ];

    /** @var array{status: string, progress: int} */
    protected $attributes = [
        'status' => 'uploaded',
        'progress' => 0,
    ];

    /**
     * Event: File uploaded - create new processing session
     */
    public static function uploaded(UploadedFile $file, string $filePath, string $sessionId): self
    {
        return self::create([
            'id' => $sessionId,
            'filename' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'status' => Status::UPLOADED,
            'progress' => 0,
            'message' => 'Video uploaded successfully',
        ]);
    }

    /**
     * Event: Processing started
     * @param array{mode: string, quality: string, count: int, sample_rate: int} $config
     */
    public function startProcessing(array $config): void
    {
        $this->update([
            'status' => Status::PROCESSING,
            'message' => 'Processing started',
            'started_at' => now(),
            'mode' => $config['mode'],
            'quality' => $config['quality'],
            'count' => $config['count'],
            'sample_rate' => $config['sample_rate'],
        ]);
    }

    /**
     * Event: Progress updated
     */
    public function progressUpdated(int $progress, ?string $message = null): void
    {
        $updateData = ['progress' => $progress];

        if ($message) {
            $updateData['message'] = $message;
        }

        $this->update($updateData);
    }

    /**
     * Event: Processing completed
     */
    public function completed(int $frameCount): void
    {
        $this->update([
            'status' => Status::COMPLETED,
            'progress' => 100,
            'message' => "Extracted {$frameCount} frames",
            'frame_count' => $frameCount,
            'completed_at' => now(),
        ]);
    }

    /**
     * Event: Processing failed
     */
    public function failed(string $error): void
    {
        $this->update([
            'status' => Status::FAILED,
            'message' => $error,
        ]);
    }

    /**
     * Check if session is ready for processing
     */
    public function canProcess(): bool
    {
        return $this->status === Status::UPLOADED;
    }

    /**
     * Check if session is currently processing
     */
    public function isProcessing(): bool
    {
        return $this->status === Status::PROCESSING;
    }

    /**
     * Check if session is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === Status::COMPLETED;
    }

    /**
     * Check if session has failed
     */
    public function hasFailed(): bool
    {
        return $this->status === Status::FAILED;
    }

    #[\Override]
    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'progress' => 'integer',
            'count' => 'integer',
            'sample_rate' => 'integer',
            'frame_count' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'status' => Status::class,
        ];
    }
}
