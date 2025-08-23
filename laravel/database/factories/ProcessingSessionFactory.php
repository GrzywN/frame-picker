<?php

namespace Database\Factories;

use App\Enums\Status;
use App\Models\ProcessingSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProcessingSession>
 */
class ProcessingSessionFactory extends Factory
{
    protected $model = ProcessingSession::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    #[\Override]
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'filename' => $this->faker->word().'.mp4',
            'file_path' => 'uploads/'.Str::uuid(),
            'mime_type' => 'video/mp4',
            'file_size' => $this->faker->numberBetween(1000000, 50000000),
            'status' => Status::UPLOADED,
            'progress' => 0,
            'message' => 'Video uploaded successfully',
            'started_at' => null,
            'completed_at' => null,
            'mode' => null,
            'quality' => null,
            'count' => null,
            'sample_rate' => null,
            'frame_count' => null,
        ];
    }

    /**
     * Indicate that the session is processing.
     */
    public function processing(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Status::PROCESSING,
            'progress' => $this->faker->numberBetween(10, 90),
            'message' => 'Processing in progress...',
            'started_at' => now(),
            'mode' => $this->faker->randomElement(['profile', 'action']),
            'quality' => $this->faker->randomElement(['fast', 'balanced', 'best']),
            'count' => $this->faker->randomElement([1, 3, 5, 10]),
            'sample_rate' => $this->faker->randomElement([15, 30, 45]),
        ]);
    }

    /**
     * Indicate that the session is completed.
     */
    public function completed(): static
    {
        $frameCount = $this->faker->numberBetween(1, 10);

        return $this->state(fn (array $attributes): array => [
            'status' => Status::COMPLETED,
            'progress' => 100,
            'message' => "Extracted {$frameCount} frames",
            'started_at' => now()->subMinutes(5),
            'completed_at' => now(),
            'mode' => $this->faker->randomElement(['profile', 'action']),
            'quality' => $this->faker->randomElement(['fast', 'balanced', 'best']),
            'count' => $frameCount,
            'sample_rate' => $this->faker->randomElement([15, 30, 45]),
            'frame_count' => $frameCount,
        ]);
    }

    /**
     * Indicate that the session has failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Status::FAILED,
            'progress' => $this->faker->numberBetween(10, 80),
            'message' => 'Processing failed: '.$this->faker->sentence(),
            'started_at' => now()->subMinutes(2),
            'mode' => $this->faker->randomElement(['profile', 'action']),
            'quality' => $this->faker->randomElement(['fast', 'balanced', 'best']),
            'count' => $this->faker->randomElement([1, 3, 5, 10]),
            'sample_rate' => $this->faker->randomElement([15, 30, 45]),
        ]);
    }
}
