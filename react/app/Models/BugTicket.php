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
        'status',
        'assigned_to',
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
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignedTo(): BelongsTo
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
}
