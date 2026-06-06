<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnitConversion extends Model
{
    protected $fillable = [
        'tenant_id',
        'base_unit',
        'target_unit',
        'conversion_rate',
    ];

    protected $casts = [
        'conversion_rate' => 'decimal:6',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
