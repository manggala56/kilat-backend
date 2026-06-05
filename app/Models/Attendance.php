<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'tenant_id',
        'shift_id',
        'clock_in_time',
        'clock_out_time',
        'starting_cash',
        'system_recorded_cash',
        'actual_cash_input',
        'discrepancy',
        'total_transactions',
        'notes',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
    
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
