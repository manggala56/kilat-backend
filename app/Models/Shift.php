<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'start_time', 'end_time'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
    
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
