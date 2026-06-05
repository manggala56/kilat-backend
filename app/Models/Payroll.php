<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    protected $fillable = [
        'tenant_id', 'employee_id', 'period_start', 'period_end',
        'base_salary', 'attendance_bonus', 'deductions', 'net_salary', 'status'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
