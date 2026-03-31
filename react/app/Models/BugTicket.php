<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class BugTicket extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_OPEN = 'open';
    public const STATUS_PENDING_ESTIMATE = 'pending_estimate';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_REOPENED = 'diproses kembali';

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
        'estimated_completion_at',
        'estimate_updated_by',
        'estimate_updated_at',
        'estimate_change_reason',
        'appeal_count',
    ];

    public const ARCHIVED_STATUSES = [
        self::STATUS_RESOLVED,
        self::STATUS_CLOSED,
    ];

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
        'deleted_at' => 'datetime',
        'taken_at' => 'datetime',
        'resolved_at' => 'datetime',
        'estimated_completion_at' => 'datetime',
        'estimate_updated_at' => 'datetime',
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

    public function estimateUpdatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estimate_updated_by');
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

    public function hasEstimate(): bool
    {
        return $this->estimated_completion_at !== null;
    }

    public function estimateAssignmentDeadlineAt(): ?Carbon
    {
        if (
            $this->status !== self::STATUS_PENDING_ESTIMATE ||
            (int) $this->assigned_to <= 0 ||
            !$this->taken_at ||
            $this->hasEstimate()
        ) {
            return null;
        }

        return Carbon::parse($this->taken_at)->utc()->addDays(3);
    }

    public function shouldReleasePendingEstimate($referenceTime = null): bool
    {
        $deadline = $this->estimateAssignmentDeadlineAt();
        if (!$deadline) {
            return false;
        }

        $now = $referenceTime
            ? Carbon::parse($referenceTime)->utc()
            : now()->utc();

        return $deadline->lessThanOrEqualTo($now);
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
        $userId = (int) $userId;
        if ($userId <= 0) {
            return $this;
        }

        $collaborators = is_array($this->collaborators) ? $this->collaborators : [];
        $collaborators = array_values(array_unique(array_map('intval', $collaborators)));

        if (!in_array($userId, $collaborators, true)) {
            $collaborators[] = $userId;
        }

        $this->collaborators = $collaborators;

        return $this;
    }

    public function removeCollaborator($userId)
    {
        $userId = (int) $userId;
        if ($this->collaborators && is_array($this->collaborators)) {
            $collaborators = array_values(array_unique(array_map('intval', $this->collaborators)));
            $this->collaborators = array_values(array_filter($collaborators, function ($id) use ($userId) {
                return $id !== $userId;
            }));
        }

        return $this;
    }
}
