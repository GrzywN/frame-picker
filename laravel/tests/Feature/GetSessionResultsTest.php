<?php

namespace Tests\Feature;

use App\Enums\Status;
use App\Models\ProcessingSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GetSessionResultsTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_results_for_completed_session(): void
    {
        // Create session and complete processing lifecycle
        $session = ProcessingSession::factory()->create([
            'status' => Status::UPLOADED,
        ]);

        // Start processing
        $session->startProcessing([
            'mode' => 'profile',
            'quality' => 'balanced',
            'count' => 5,
            'sample_rate' => 30,
        ]);

        // Complete processing
        $session->completed(5);

        // Get results
        $response = $this->getJson("/sessions/{$session->id}/results");

        // Check response structure and data
        $response->assertStatus(200)
            ->assertJsonStructure([
                'frames',
                'frame_count',
            ])
            ->assertJson([
                'frames' => [],  // Placeholder empty array
                'frame_count' => 5,
            ]);

        // Verify session is in correct state
        $session->refresh();
        $this->assertTrue($session->isCompleted());
        $this->assertEquals(5, $session->frame_count);
        $this->assertEquals(100, $session->progress);
        $this->assertNotNull($session->completed_at);

        // Test edge cases

        // Session with zero frames
        $emptySession = ProcessingSession::factory()->completed()->create([
            'frame_count' => 0,
        ]);

        $response = $this->getJson("/sessions/{$emptySession->id}/results");
        $response->assertStatus(200)
            ->assertJson([
                'frames' => [],
                'frame_count' => 0,
            ]);

        // Session with null frame count
        $nullSession = ProcessingSession::factory()->create([
            'status' => Status::COMPLETED,
            'frame_count' => null,
        ]);

        $response = $this->getJson("/sessions/{$nullSession->id}/results");
        $response->assertStatus(200)
            ->assertJson([
                'frames' => [],
                'frame_count' => null,
            ]);
    }
}
