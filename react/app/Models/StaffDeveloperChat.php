<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StaffDeveloperChat extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id',
        'developer_id',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function developer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'developer_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(StaffDeveloperChatMessage::class, 'chat_id');
    }
}
