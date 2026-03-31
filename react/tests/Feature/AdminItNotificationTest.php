<?php

use App\Models\AdminItNotification;
use App\Models\BugTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a stored notification when pending estimate ticket is one day away from expiry', function () {
    $admin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Integrasi API hampir melewati tenggat estimasi',
        'description' => 'Admin IT harus segera mengatur estimasi.',
        'category' => 'bug',
        'priority' => 'high',
        'difficulty_level' => 'hard',
        'status' => BugTicket::STATUS_PENDING_ESTIMATE,
        'assigned_to' => $admin->id,
        'taken_at' => now()->subDays(2)->subHours(1),
    ]);

    $countResponse = $this->actingAs($admin)->getJson('/api/admin-it/notifications/unread-count');

    $countResponse->assertOk();
    $countResponse->assertJsonPath('unread_count', 1);

    $notification = AdminItNotification::query()->first();

    expect($notification)->not->toBeNull();
    expect((int) $notification?->user_id)->toBe($admin->id);
    expect((int) $notification?->bug_ticket_id)->toBe($ticket->id);
    expect($notification?->type)->toBe(AdminItNotification::TYPE_PENDING_ESTIMATE_DUE_SOON);

    $listResponse = $this->actingAs($admin)->getJson('/api/admin-it/notifications');

    $listResponse->assertOk();
    $listResponse->assertJsonPath('unread_count', 1);
    $listResponse->assertJsonPath('unread_notifications.0.ticket.id', $ticket->id);
    $listResponse->assertJsonPath('unread_notifications.0.type', AdminItNotification::TYPE_PENDING_ESTIMATE_DUE_SOON);
});

it('moves notifications into history after admin marks them as read', function () {
    $admin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Estimasi pengerjaan belum diatur',
        'description' => 'Perlu notifikasi tersimpan untuk admin.',
        'category' => 'bug',
        'priority' => 'medium',
        'difficulty_level' => 'medium',
        'status' => BugTicket::STATUS_PENDING_ESTIMATE,
        'assigned_to' => $admin->id,
        'taken_at' => now()->subDays(2)->subHours(2),
    ]);

    $this->actingAs($admin)->getJson('/api/admin-it/notifications');

    $notification = AdminItNotification::query()->firstOrFail();

    $response = $this->actingAs($admin)->patchJson('/api/admin-it/notifications/read-all');

    $response->assertOk();
    $response->assertJsonPath('unread_count', 0);

    $notification->refresh();
    expect($notification->read_at)->not->toBeNull();

    $listResponse = $this->actingAs($admin)->getJson('/api/admin-it/notifications');

    $listResponse->assertOk();
    $listResponse->assertJsonPath('unread_count', 0);
    $listResponse->assertJsonCount(0, 'unread_notifications');
    $listResponse->assertJsonCount(1, 'history_notifications');
});

it('marks due soon notifications as read after estimate is set', function () {
    $admin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Tiket harus segera diestimasi',
        'description' => 'Notif baru harus hilang dari daftar unread setelah estimasi diatur.',
        'category' => 'bug',
        'priority' => 'high',
        'difficulty_level' => 'hard',
        'status' => BugTicket::STATUS_PENDING_ESTIMATE,
        'assigned_to' => $admin->id,
        'taken_at' => now()->subDays(2)->subHours(3),
    ]);

    $this->actingAs($admin)->getJson('/api/admin-it/notifications/unread-count');

    $notification = AdminItNotification::query()->firstOrFail();
    expect($notification->read_at)->toBeNull();

    $estimateAt = now()->addDay()->setHour(15)->setMinute(0)->setSecond(0)->setMicrosecond(0);

    $response = $this->actingAs($admin)->patchJson(
        "/api/bug-tickets/{$ticket->id}/estimate",
        [
            'estimated_completion_at' => $estimateAt->toIso8601String(),
        ],
    );

    $response->assertOk();

    $notification->refresh();
    expect($notification->read_at)->not->toBeNull();

    $countResponse = $this->actingAs($admin)->getJson('/api/admin-it/notifications/unread-count');
    $countResponse->assertOk();
    $countResponse->assertJsonPath('unread_count', 0);
});
