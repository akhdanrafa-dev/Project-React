<?php

use App\Models\BugTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('hides unassigned resolved tickets from admin ticket list', function () {
    $admin = User::factory()->role('admin_it')->create();
    $otherAdmin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $assignedToCurrentAdmin = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Assigned to current admin',
        'description' => 'Ticket handled by current admin',
        'category' => 'bug',
        'priority' => 'high',
        'status' => 'resolved',
        'assigned_to' => $admin->id,
    ]);

    $unassignedOpen = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Unassigned open ticket',
        'description' => 'Open queue ticket',
        'category' => 'bug',
        'priority' => 'medium',
        'difficulty_level' => 'medium',
        'status' => 'open',
        'assigned_to' => null,
    ]);

    $unassignedOpenWithoutDifficulty = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Unassigned open ticket without difficulty',
        'description' => 'Must stay hidden until developer sets difficulty',
        'category' => 'bug',
        'priority' => 'medium',
        'difficulty_level' => null,
        'status' => 'open',
        'assigned_to' => null,
    ]);

    $unassignedResolved = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Unassigned resolved ticket',
        'description' => 'Imported resolved ticket without handler',
        'category' => 'bug',
        'priority' => 'low',
        'status' => 'resolved',
        'assigned_to' => null,
    ]);

    $assignedToOtherAdmin = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Assigned to other admin',
        'description' => 'Must not be visible',
        'category' => 'bug',
        'priority' => 'medium',
        'status' => 'in_progress',
        'assigned_to' => $otherAdmin->id,
    ]);

    $response = $this->actingAs($admin)->getJson('/api/bug-tickets');

    $response->assertOk();

    $ticketIds = collect($response->json())->pluck('id')->map(fn ($id) => (int) $id);

    expect($ticketIds)->toContain($assignedToCurrentAdmin->id);
    expect($ticketIds)->toContain($unassignedOpen->id);
    expect($ticketIds)->not->toContain($unassignedOpenWithoutDifficulty->id);
    expect($ticketIds)->not->toContain($unassignedResolved->id);
    expect($ticketIds)->not->toContain($assignedToOtherAdmin->id);
});

it('forbids admin from opening unassigned non-open ticket detail', function () {
    $admin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Resolved without handler',
        'description' => 'Should not be accessible to admin ticket detail',
        'category' => 'bug',
        'priority' => 'high',
        'status' => 'resolved',
        'assigned_to' => null,
    ]);

    $response = $this->actingAs($admin)->getJson("/api/bug-tickets/{$ticket->id}");

    $response->assertStatus(403);
});

it('forbids admin from opening unassigned open ticket detail before difficulty is set', function () {
    $admin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Open without difficulty',
        'description' => 'Developer has not scored this ticket yet',
        'category' => 'bug',
        'priority' => 'high',
        'difficulty_level' => null,
        'status' => 'open',
        'assigned_to' => null,
    ]);

    $response = $this->actingAs($admin)->getJson("/api/bug-tickets/{$ticket->id}");

    $response->assertStatus(403);
});

it('blocks admin from taking hidden ticket before developer sets difficulty level', function () {
    $admin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Ticket without difficulty',
        'description' => 'Must not be assignable yet',
        'category' => 'bug',
        'priority' => 'medium',
        'difficulty_level' => null,
        'status' => 'open',
        'assigned_to' => null,
    ]);

    $response = $this->actingAs($admin)->patchJson(
        "/api/bug-tickets/{$ticket->id}/take",
        [
            'assigned_to' => $admin->id,
        ],
    );

    $response->assertStatus(403);
});

it('moves ticket to pending estimate status when admin takes it', function () {
    $admin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Ticket siap diambil',
        'description' => 'Developer sudah mengisi tingkat kesulitan.',
        'category' => 'bug',
        'priority' => 'medium',
        'difficulty_level' => 'medium',
        'status' => BugTicket::STATUS_OPEN,
        'assigned_to' => null,
    ]);

    $response = $this->actingAs($admin)->patchJson(
        "/api/bug-tickets/{$ticket->id}/take",
        [
            'assigned_to' => $admin->id,
            'status' => BugTicket::STATUS_IN_PROGRESS,
        ],
    );

    $response->assertOk();
    $response->assertJsonPath('status', BugTicket::STATUS_PENDING_ESTIMATE);

    $ticket->refresh();

    expect($ticket->status)->toBe(BugTicket::STATUS_PENDING_ESTIMATE);
    expect((int) $ticket->assigned_to)->toBe($admin->id);
    expect($ticket->taken_at)->not->toBeNull();
});

it('reopens pending estimate ticket after three days without estimate', function () {
    $ownerAdmin = User::factory()->role('admin_it')->create();
    $otherAdmin = User::factory()->role('admin_it')->create();
    $reporter = User::factory()->create();

    $ticket = BugTicket::create([
        'user_id' => $reporter->id,
        'title' => 'Ticket kadaluarsa estimasi',
        'description' => 'Harus terbuka kembali jika estimasi belum diatur.',
        'category' => 'bug',
        'priority' => 'high',
        'difficulty_level' => 'hard',
        'status' => BugTicket::STATUS_PENDING_ESTIMATE,
        'assigned_to' => $ownerAdmin->id,
        'taken_at' => now()->subDays(4),
        'collaboration_type' => 'collab',
        'collaborators' => [$otherAdmin->id],
    ]);

    $response = $this->actingAs($otherAdmin)->getJson('/api/bug-tickets');

    $response->assertOk();

    $ticket->refresh();

    expect($ticket->status)->toBe(BugTicket::STATUS_OPEN);
    expect($ticket->assigned_to)->toBeNull();
    expect($ticket->taken_at)->toBeNull();
    expect($ticket->collaboration_type)->toBe('solo');
    expect($ticket->collaborators)->toBeNull();

    $ticketIds = collect($response->json())->pluck('id')->map(fn ($id) => (int) $id);
    expect($ticketIds)->toContain($ticket->id);
});

it('stores new bug tickets without default difficulty level', function () {
    $reporter = User::factory()->create();

    $response = $this->actingAs($reporter)->postJson('/api/bug-tickets', [
        'title' => 'Bug baru',
        'description' => 'Laporan baru harus menunggu penilaian developer.',
        'category' => 'bug',
        'priority' => 'medium',
    ]);

    $response->assertCreated();

    $ticketId = $response->json('id') ?? $response->json('data.id');

    expect($ticketId)->not->toBeNull();

    $this->assertDatabaseHas('bug_tickets', [
        'id' => $ticketId,
        'difficulty_level' => null,
    ]);
});
