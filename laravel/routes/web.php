<?php

use App\Http\Controllers\ProcessingSessionController;
use Illuminate\Support\Facades\Route;

// Frontend route - serve the main app
Route::get('/', function () {
    return view('app');
});

// Processing sessions API
Route::post('/sessions', [ProcessingSessionController::class, 'store']);
Route::post('/sessions/{id}/process', [ProcessingSessionController::class, 'process']);
Route::get('/sessions/{id}/status', [ProcessingSessionController::class, 'status']);
Route::get('/sessions/{id}/results', [ProcessingSessionController::class, 'results']);
