<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Restock extends Model
{
    protected $fillable = [
        'tenant_id',
        'product_id',
        'raw_material_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'supplier_name',
        'restock_date',
        'expired_date',
        'notes',
    ];
}
