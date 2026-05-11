<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentHistory extends Model
{
    protected $fillable = ['tenant_id', 'xendit_ref', 'amount', 'payment_method', 'status', 'paid_at'];

    protected $casts = ['amount' => 'decimal:2', 'paid_at' => 'datetime'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
