<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGoogleDrive extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'is_connected',
        'email',
        'access_token',
        'refresh_token',
        'folder_id',
        'token_expires_at',
    ];

    protected $casts = [
        'is_connected' => 'boolean',
        'token_expires_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
