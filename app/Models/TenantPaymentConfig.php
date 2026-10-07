<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantPaymentConfig extends Model
{
    protected $table = 'tenant_payment_configs';

    protected $fillable = [
        'tenant_id',
        'doku_settlement_bank_account_id',
        'fee_type',
        'platform_fee_fixed',
        'platform_fee_percent',
        'fee_multiple_step',
        'fee_multiple_amount',
        'fee_tiers',
        'is_split_active',
    ];

    protected $casts = [
        'platform_fee_fixed'   => 'decimal:2',
        'platform_fee_percent' => 'decimal:2',
        'fee_multiple_step'    => 'decimal:2',
        'fee_multiple_amount'  => 'decimal:2',
        'fee_tiers'            => 'array',
        'is_split_active'       => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
