<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tenant extends Model
{
    protected $fillable = [
        'owner_id',
        'business_name',
        'store_id',
        'business_address',
        'subscription_package_id',
        'status',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function subscriptionPackage(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPackage::class);
    }

    public function devices()
    {
        return $this->hasMany(Device::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function googleDrive()
    {
        return $this->hasOne(TenantGoogleDrive::class);
    }

    public function paymentConfig()
    {
        return $this->hasOne(TenantPaymentConfig::class);
    }

    public function kyc()
    {
        return $this->hasOne(TenantKyc::class);
    }

    public function getIsQrisApprovedAttribute(): bool
    {
        return $this->kyc?->status === 'approved';
    }

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant) {
            if (empty($tenant->store_id)) {
                $tenant->store_id = static::generateUniqueStoreSlug($tenant->business_name);
            }
        });
    }

    /**
     * Generate unique, collision-free short slug hash for store identification
     * e.g. "kopi-kenangan-a8f2"
     */
    public static function generateUniqueStoreSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = \Illuminate\Support\Str::slug($name);
        if (empty($baseSlug)) {
            $baseSlug = 'outlet';
        }

        // Generate 4-char short hash
        $shortHash = strtolower(\Illuminate\Support\Str::random(4));
        $slug = "{$baseSlug}-{$shortHash}";

        // Ensure uniqueness across tenants
        while (static::where('store_id', $slug)->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $shortHash = strtolower(\Illuminate\Support\Str::random(4));
            $slug = "{$baseSlug}-{$shortHash}";
        }

        return $slug;
    }
}
