<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPackage extends Model
{
    protected $fillable = ['name', 'description', 'price', 'duration_in_days', 'max_outlets', 'max_devices_per_outlet', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'max_outlets' => 'integer',
        'max_devices_per_outlet' => 'integer',
    ];

    public function tenants()
    {
        return $this->hasMany(Tenant::class);
    }
}
