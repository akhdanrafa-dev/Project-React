<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductAlert extends Model
{
    protected $fillable = [
        'product_id',
        'developer_id',
        'alert_type',
        'new_value',
        'description',
        'status',
        'completed_by',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function developer()
    {
        return $this->belongsTo(User::class, 'developer_id');
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
