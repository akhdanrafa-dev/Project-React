<?php

use App\Models\BugTicket;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows the assigned admin to set an estimate, moves the ticket to in progress, and writes it to chat', function () {
    $admin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Integrasi gagal diproses',
        'description' => 'Perlu penanganan lanjutan.',
        'category' => 'bug',
        'priority' => 'high',
        'status' => BugTicket::STATUS_PENDING_ESTIMATE,
        'assigned_to' => $admin->id,
        'taken_at' => now(),
    ]);

    $estimateAt = now()->addDays(2)->setHour(14)->setMinute(30)->setSecond(0);

    $response = $this->actingAs($admin)->patchJson(
        "/api/bug-tickets/{$ticket->id}/estimate",
        [
            'estimated_completion_at' => $estimateAt->toIso8601String(),
        ],
    );

    $response->assertOk();
    $response->assertJsonPath('ticket.id', $ticket->id);

    $ticket->refresh();

    expect($ticket->estimated_completion_at)->not->toBeNull();
    expect((int) $ticket->estimate_updated_by)->toBe($admin->id);
    expect($ticket->status)->toBe(BugTicket::STATUS_IN_PROGRESS);

    $chatMessage = ChatMessage::where('ticket_id', $ticket->id)
        ->latest('id')
        ->first();

    expect($chatMessage)->not->toBeNull();
    expect($chatMessage?->message)->toContain('Estimasi ');
    expect($chatMessage?->message)->toContain($admin->name);
});

it('requires suggested estimate and reason when developer sends estimate suggestion', function () {
    $admin = User::factory()->role('admin_it')->create();
    $developer = User::factory()->role('developer')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Sinkronisasi stok lambat',
        'description' => 'Estimasi awal perlu direvisi.',
        'category' => 'bug',
        'priority' => 'medium',
        'status' => 'in_progress',
        'assigned_to' => $admin->id,
        'taken_at' => now(),
        'estimated_completion_at' => now()->addDay(),
        'estimate_updated_by' => $admin->id,
        'estimate_updated_at' => now(),
    ]);

    $response = $this->actingAs($developer)->patchJson(
        "/api/bug-tickets/{$ticket->id}/estimate",
        [
        ],
    );

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('estimated_completion_at');
    $response->assertJsonValidationErrors('reason');
});

it('allows developer to send estimate suggestion without changing official estimate and notifies via chat', function () {
    $admin = User::factory()->role('admin_it')->create();
    $developer = User::factory()->role('developer')->create();
    $reporter = User::factory()->create();

    $initialEstimate = now()->addDay()->setHour(9)->setMinute(0)->setSecond(0)->setMicrosecond(0);

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Export laporan timeout',
        'description' => 'Butuh perpanjangan estimasi.',
        'category' => 'bug',
        'priority' => 'high',
        'status' => 'in_progress',
        'assigned_to' => $admin->id,
        'taken_at' => now(),
        'estimated_completion_at' => $initialEstimate,
        'estimate_updated_by' => $admin->id,
        'estimate_updated_at' => now(),
    ]);

    $response = $this->actingAs($developer)->patchJson(
        "/api/bug-tickets/{$ticket->id}/estimate",
        [
            'estimated_completion_at' => now()->addDays(3)->setHour(15)->setMinute(45)->setSecond(0)->setMicrosecond(0)->toIso8601String(),
            'reason' => 'Estimasi perlu dicek lagi karena progress pekerjaan terlihat lebih cepat dari target awal.',
        ],
    );

    $response->assertOk();
    $response->assertJsonPath('message', 'Saran estimasi berhasil dikirim ke Admin IT.');

    $ticket->refresh();
    expect((int) $ticket->estimate_updated_by)->toBe($admin->id);
    expect($ticket->estimated_completion_at?->toISOString())
        ->toBe($initialEstimate->copy()->utc()->toISOString());
    expect($ticket->estimate_change_reason)->toBeNull();

    $chatMessage = ChatMessage::where('ticket_id', $ticket->id)
        ->latest('id')
        ->first();

    expect($chatMessage)->not->toBeNull();
    expect($chatMessage?->message)->toContain('Saran estimasi selesai');
    expect($chatMessage?->message)->toContain('Saran baru:');
    expect($chatMessage?->message)->toContain($developer->name);
    expect($chatMessage?->message)->toContain('Alasan:');
});
