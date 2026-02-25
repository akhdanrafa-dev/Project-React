<?php

use App\Models\BugTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('can send a chat message with image attachment only', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $ticket = BugTicket::create([
        'user_id' => $user->id,
        'title' => 'Error login saat submit',
        'description' => 'Terjadi error saat klik tombol submit',
        'category' => 'bug',
        'priority' => 'high',
        'status' => 'open',
    ]);

    $image = UploadedFile::fake()->image('error-screenshot.png', 1200, 900)->size(1200);

    $response = $this->actingAs($user)
        ->post("/api/bug-tickets/{$ticket->id}/messages", [
            'image' => $image,
        ], [
            'Accept' => 'application/json',
        ]);

    $response->assertCreated();
    $response->assertJsonPath('user_id', $user->id);

    $storedPath = $response->json('image_path');
    expect($storedPath)->not->toBeNull();

    Storage::disk('public')->assertExists($storedPath);

    $this->assertDatabaseHas('chat_messages', [
        'ticket_id' => $ticket->id,
        'user_id' => $user->id,
        'message' => '',
        'image_original_name' => 'error-screenshot.png',
    ]);
});

it('rejects chat image larger than 5mb', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $ticket = BugTicket::create([
        'user_id' => $user->id,
        'title' => 'UI freeze',
        'description' => 'Halaman freeze saat membuka menu',
        'category' => 'bug',
        'priority' => 'medium',
        'status' => 'open',
    ]);

    $tooLargeImage = UploadedFile::fake()->image('too-large.png')->size(6000);

    $response = $this->actingAs($user)
        ->post("/api/bug-tickets/{$ticket->id}/messages", [
            'image' => $tooLargeImage,
        ], [
            'Accept' => 'application/json',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('image');

    $this->assertDatabaseCount('chat_messages', 0);
});

it('rejects empty chat payload without message and image', function () {
    $user = User::factory()->create();
    $ticket = BugTicket::create([
        'user_id' => $user->id,
        'title' => 'Bug produk',
        'description' => 'Detail bug',
        'category' => 'bug',
        'priority' => 'low',
        'status' => 'open',
    ]);

    $response = $this->actingAs($user)
        ->postJson("/api/bug-tickets/{$ticket->id}/messages", []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['message', 'image']);
});
