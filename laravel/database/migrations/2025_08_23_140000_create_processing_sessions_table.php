<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processing_sessions', static function (Blueprint $table): void {
            $table->uuid('id')->primary();
            // File data
            $table->string('filename');
            $table->string('file_path');
            $table->string('mime_type');
            $table->bigInteger('file_size');
            // Status and lifecycle
            $table->string('status')->default('uploaded');
            $table->integer('progress')->default(0);
            $table->text('message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            // Processing configuration
            $table->enum('mode', ['profile', 'action'])->nullable();
            $table->enum('quality', ['fast', 'balanced', 'best'])->nullable();
            $table->integer('count')->nullable();
            $table->integer('sample_rate')->nullable();
            // Results
            $table->integer('frame_count')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processing_sessions');
    }
};
