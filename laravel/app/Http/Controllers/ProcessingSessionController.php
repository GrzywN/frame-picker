<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProcessSessionRequest;
use App\Http\Requests\StoreProcessingSessionRequest;
use App\Models\ProcessingSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class ProcessingSessionController extends Controller
{
    /** Creates processing session from uploaded file */
    public function store(StoreProcessingSessionRequest $request): JsonResponse
    {
        $file = $request->file('video');
        assert($file instanceof UploadedFile);
        
        $sessionId = Str::uuid()->toString();
        $path = $file->storeAs('uploads', $sessionId);
        assert(is_string($path));

        // Event: File uploaded - create processing session
        $session = ProcessingSession::uploaded($file, $path, $sessionId);

        return response()->json([
            'session_id' => $session->id,
            'status' => $session->status->value,
            'message' => $session->message,
        ], 201);
    }

    /** Start processing with configuration */
    public function process(ProcessSessionRequest $request, string $id): JsonResponse
    {
        $session = ProcessingSession::findOrFail($id);

        if (! $session->canProcess()) {
            return response()->json([
                'error' => 'Session is not ready for processing',
            ], 400);
        }

        /** @var array{mode: string, quality: string, count: int, sample_rate: int} $config */
        $config = $request->validated();

        // Event: Processing started
        $session->startProcessing($config);

        return response()->json([
            'status' => $session->status->value,
            'message' => $session->message,
        ]);
    }

    /** Get processing status */
    public function status(string $id): JsonResponse
    {
        $session = ProcessingSession::findOrFail($id);

        return response()->json([
            'status' => $session->status->value,
            'progress' => $session->progress,
            'message' => $session->message,
            'frame_count' => $session->frame_count,
        ]);
    }

    /** Get results (placeholder) */
    public function results(string $id): JsonResponse
    {
        $session = ProcessingSession::findOrFail($id);

        if (! $session->isCompleted()) {
            return response()->json([
                'error' => 'Processing not completed',
            ], 400);
        }

        // TODO: Return actual frame results
        return response()->json([
            'frames' => [],
            'frame_count' => $session->frame_count,
        ]);
    }
}
