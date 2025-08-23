<?php

namespace Tests\Feature;

use App\Enums\Status;
use App\Models\ProcessingSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StartProcessingTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_starts_processing_with_config(): void
    {
        // Create uploaded session
        $session = ProcessingSession::factory()->create([
            'status' => Status::UPLOADED,
        ]);

        // Start processing with config
        $config = [
            'mode' => 'PROFILE',
            'quality' => 'BALANCED',
            'count' => 3,
            'sample_rate' => 30,
        ];

        $response = $this->postJson("/sessions/{$session->id}/process", $config);

        // Check response
        $response->assertStatus(200)
            ->assertJson([
                'status' => Status::PROCESSING->value,
                'message' => 'Processing started',
            ]);

        // Check database updated
        $session->refresh();
        $this->assertEquals(Status::PROCESSING, $session->status);
        $this->assertEquals('profile', $session->mode);
        $this->assertEquals('balanced', $session->quality);
        $this->assertEquals(3, $session->count);
        $this->assertEquals(30, $session->sample_rate);
        $this->assertEquals('Processing started', $session->message);
        $this->assertNotNull($session->started_at);
        $this->assertNull($session->completed_at);
        $this->assertNull($session->frame_count);

        // Check session can process flag
        $this->assertFalse($session->canProcess());
        $this->assertTrue($session->isProcessing());
        $this->assertFalse($session->isCompleted());
        $this->assertFalse($session->hasFailed());
    }
}
