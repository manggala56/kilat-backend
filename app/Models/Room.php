<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'hourly_rate',
        'status',
        'qr_token',
    ];

    protected static function booted()
    {
        static::creating(function ($room) {
            if (empty($room->qr_token)) {
                $room->qr_token = static::generateUniqueQrToken();
            }
        });
    }

    public static function generateUniqueQrToken(): string
    {
        do {
            $token = \Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(10));
        } while (static::where('qr_token', $token)->exists());

        return $token;
    }

    protected $casts = [
        'hourly_rate' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(RoomSession::class);
    }

    public function activeSession()
    {
        return $this->hasOne(RoomSession::class)->where('status', 'ACTIVE');
    }

    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
