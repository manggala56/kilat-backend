<?php

namespace App\Models;

use App\Support\BankList;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TenantKyc extends Model
{
    protected $table = 'tenant_kycs';

    protected $fillable = [
        'tenant_id',
        'id_card_number',
        'id_card_name',
        'id_card_photo_path',
        'bank_name',
        'bank_account_number',
        'bank_account_holder_name',
        'business_photo_path',
        'business_type',
        'status',
        'rejection_reason',
        'verified_at',
        'verified_by',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    protected $appends = [
        'id_card_photo_url',
        'business_photo_url',
        'bank_label',
        'is_approved',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function getIsApprovedAttribute(): bool
    {
        return $this->isApproved();
    }

    public function getIdCardPhotoUrlAttribute(): ?string
    {
        if (!$this->id_card_photo_path) {
            return null;
        }
        if (str_starts_with($this->id_card_photo_path, 'http')) {
            return $this->id_card_photo_path;
        }
        return Storage::disk('public')->url($this->id_card_photo_path);
    }

    public function getBusinessPhotoUrlAttribute(): ?string
    {
        if (!$this->business_photo_path) {
            return null;
        }
        if (str_starts_with($this->business_photo_path, 'http')) {
            return $this->business_photo_path;
        }
        return Storage::disk('public')->url($this->business_photo_path);
    }

    public function getBankLabelAttribute(): string
    {
        return BankList::label($this->bank_name);
    }
}
