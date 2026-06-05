<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'category', 'amount', 'expense_date', 'description'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
