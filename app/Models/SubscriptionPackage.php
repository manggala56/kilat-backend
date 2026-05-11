<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPackage extends Model
{
    protected $fillable = ['name', 'description', 'price', 'duration_in_days', 'is_active'];

    protected $casts = ['is_active' => 'boolean', 'price' => 'decimal:2'];
}
