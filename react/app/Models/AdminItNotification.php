<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminItNotification extends Model
{
    use HasFactory;

    public const TYPE_PENDING_ESTIMATE_DUE_SOON = 'pending_estimate_due_soon';

    protected $fillable = [
        'user_id',
        'bug_ticket_id',
        'type',
        'context_key',
        'title',
        'message',
        'payload',
        'read_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bugTicket(): BelongsTo
    {
        return $this->belongsTo(BugTicket::class, 'bug_ticket_id');
    }
}
