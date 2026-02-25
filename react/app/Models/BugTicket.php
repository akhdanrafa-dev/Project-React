<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BugTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ticket_number',
        'title',
        'description',
        'category',
        'priority',
        'difficulty_level',
        'collaboration_type',
        'collaborators',
        'status',
        'assigned_to',
        'taken_at',
        'resolved_at',
        'appeal_count',
    ];

    public const ARCHIVED_STATUSES = ['resolved', 'closed'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->ticket_number) {
                $year = now()->format('Y');
                $month = now()->format('m');
                $latestTicket = self::whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->latest('id')
                    ->first();
                
                $sequence = ($latestTicket ? (int) substr($latestTicket->ticket_number, -4) : 0) + 1;
                $model->ticket_number = 'TKT-' . $year . $month . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'taken_at' => 'datetime',
        'resolved_at' => 'datetime',
        'collaborators' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'ticket_id');
    }

    public function unreadMessages()
    {
        return $this->messages()->where('is_read', false);
    }

    public function unreadCount(): int
    {
        return $this->unreadMessages()->count();
    }

    public function isArchivedChat(): bool
    {
        return in_array($this->status, self::ARCHIVED_STATUSES, true);
    }

    public function getCollaboratorsDetails()
    {
        if (!$this->collaborators || !is_array($this->collaborators)) {
            return [];
        }

        return User::whereIn('id', $this->collaborators)
            ->get(['id', 'name', 'email'])
            ->toArray();
    }

    public function addCollaborator($userId)
    {
        if (!$this->collaborators) {
            $this->collaborators = [];
        }

        if (!in_array($userId, $this->collaborators)) {
            $this->collaborators = array_merge($this->collaborators, [$userId]);
        }

        return $this;
    }

    public function removeCollaborator($userId)
    {
        if ($this->collaborators && is_array($this->collaborators)) {
            $this->collaborators = array_filter($this->collaborators, function ($id) use ($userId) {
                return $id != $userId;
            });
            $this->collaborators = array_values($this->collaborators);
        }

        return $this;
    }
}
