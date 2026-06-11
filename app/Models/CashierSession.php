<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashierSession extends Model
{
    protected $fillable = [
        'tenant_id', 'cashier_id', 'clock_in_time', 'clock_out_time',
        'starting_cash', 'system_recorded_cash', 'actual_cash_input',
        'discrepancy', 'total_transactions', 'notes'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
