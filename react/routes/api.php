<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\OrderController;
use App\Models\User;

Route::post('/feedbacks', [FeedbackController::class, 'store']);

Route::middleware(['auth'])->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);

    Route::get('/staff-users', function () {
        return response()->json(
            User::where('role', 'staff')->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'status' => 'active', // Default status
                    'lastSeen' => now()->subMinutes(rand(1, 60))->toISOString(),
                ];
            })
        );
    });

    Route::get('/developers', function () {
        return response()->json(
            User::where('role', 'developer')->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => true, // Default status
                    'last_seen' => now()->subMinutes(rand(1, 60))->toISOString(),
                ];
            })
        );
    });

    Route::get('/products', [App\Http\Controllers\StaffProdukController::class, 'apiIndex']);
    Route::get('/staff-developer-chats/recent-messages', [App\Http\Controllers\ChatMessageController::class, 'getRecentMessages']);
});
