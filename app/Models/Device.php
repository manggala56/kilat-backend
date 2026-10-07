<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Sanctum\HasApiTokens;

class Device extends Model
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'tenant_id',
        'outlet_id',
        'device_id',
        'device_name',
        'device_model',
        'device_os',
        'app_version',
        'status',
        'paired_at',
        'last_active_at',
    ];

    protected $casts = [
        'paired_at' => 'datetime',
        'last_active_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
