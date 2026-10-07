<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    protected $table = 'payment_transactions';

    protected $fillable = [
        'tenant_id',
        'transaction_id',
        'invoice_number',
        'integration_type',
        'payment_method',
        'gross_amount',
        'platform_fee_amount',
        'tenant_net_amount',
        'status',
        'doku_payment_url',
        'qris_string',
        'gateway_reference',
        'raw_response_payload',
        'expired_at',
        'paid_at',
    ];

    protected $casts = [
        'gross_amount'         => 'decimal:2',
        'platform_fee_amount'  => 'decimal:2',
        'tenant_net_amount'    => 'decimal:2',
        'expired_at'           => 'datetime',
        'paid_at'              => 'datetime',
        'raw_response_payload' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
