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
    $response->assertJsonFragment(['id' => $assignedToCurrentAdmin->id]);
    $response->assertJsonFragment(['id' => $unassignedOpen->id]);
    $response->assertJsonMissing(['id' => $unassignedResolved->id]);
    $response->assertJsonMissing(['id' => $assignedToOtherAdmin->id]);
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
