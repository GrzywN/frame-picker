<?php

namespace Tests\Feature;

use App\Enums\Status;
use App\Models\ProcessingSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CreateSessionTest extends TestCase
{
    use RefreshDatabase;

    #[\Override]
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_session_from_video_upload(): void
    {
        // Use real fixture file
        $fixturePath = base_path('tests/Fixtures/sample.mp4');
        $fileSize = filesize($fixturePath);

        $file = new UploadedFile(
            $fixturePath,
            'sample.mp4',
            'video/mp4',
            null,
            true
        );

        // Upload and create session
        $response = $this->postJson('/sessions', [
            'video' => $file,
        ]);

        // Check response structure and data
        $response->assertStatus(201)
            ->assertJsonStructure([
                'session_id',
                'status',
                'message',
            ])
            ->assertJson([
                'status' => Status::UPLOADED->value,
                'message' => 'Video uploaded successfully',
            ]);

        $sessionId = $response->json('session_id');

        // Check database record
        $this->assertDatabaseHas('processing_sessions', [
            'id' => $sessionId,
            'filename' => 'sample.mp4',
            'mime_type' => 'video/mp4',
            'file_size' => $fileSize,
            'status' => Status::UPLOADED->value,
            'progress' => 0,
        ]);

        // Check file stored
        Storage::disk('local')->assertExists("uploads/{$sessionId}");

        // Check session model state
        $session = ProcessingSession::find($sessionId);
        $this->assertEquals(Status::UPLOADED, $session->status);
        $this->assertEquals(0, $session->progress);
        $this->assertEquals('Video uploaded successfully', $session->message);
        $this->assertNull($session->started_at);
        $this->assertNull($session->completed_at);
        $this->assertNull($session->mode);
        $this->assertNull($session->quality);
        $this->assertNull($session->count);
        $this->assertNull($session->sample_rate);
        $this->assertNull($session->frame_count);

        // Check file metadata
        $this->assertEquals('sample.mp4', $session->filename);
        $this->assertEquals('video/mp4', $session->mime_type);
        $this->assertEquals($fileSize, $session->file_size);
    }
}
