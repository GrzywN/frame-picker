<?php

namespace Tests\Feature;

use App\Enums\Status;
use App\Models\ProcessingSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GetSessionStatusTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_session_status_through_lifecycle(): void
    {
        // Create uploaded session
        $session = ProcessingSession::factory()->create([
            'status' => Status::UPLOADED,
            'progress' => 0,
            'message' => 'Video uploaded successfully',
            'frame_count' => null,
        ]);

        // Check uploaded status
        $response = $this->getJson("/sessions/{$session->id}/status");
        $response->assertStatus(200)
            ->assertExactJson([
                'status' => Status::UPLOADED->value,
                'progress' => 0,
                'message' => 'Video uploaded successfully',
                'frame_count' => null,
            ]);

        // Start processing
        $session->startProcessing([
            'mode' => 'profile',
            'quality' => 'balanced',
            'count' => 3,
            'sample_rate' => 30,
        ]);

        // Check processing status
        $response = $this->getJson("/sessions/{$session->id}/status");
        $response->assertStatus(200)
            ->assertJson([
                'status' => Status::PROCESSING->value,
                'progress' => 0,
                'message' => 'Processing started',
                'frame_count' => null,
            ]);

        // Update progress
        $session->progressUpdated(50, 'Extracting frames...');

        $response = $this->getJson("/sessions/{$session->id}/status");
        $response->assertStatus(200)
            ->assertJson([
                'status' => Status::PROCESSING->value,
                'progress' => 50,
                'message' => 'Extracting frames...',
                'frame_count' => null,
            ]);

        // Complete processing
        $session->completed(3);

        $response = $this->getJson("/sessions/{$session->id}/status");
        $response->assertStatus(200)
            ->assertJson([
                'status' => Status::COMPLETED->value,
                'progress' => 100,
                'message' => 'Extracted 3 frames',
                'frame_count' => 3,
            ]);

        // Check session state flags
        $session->refresh();
        $this->assertFalse($session->canProcess());
        $this->assertFalse($session->isProcessing());
        $this->assertTrue($session->isCompleted());
        $this->assertFalse($session->hasFailed());
    }
}
