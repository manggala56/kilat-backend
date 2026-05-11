<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'sales_name',
        'discount_percentage',
        'used_count',
        'is_active',
        'type',
        'sales_id',
        'subscription_package_id',
        'duration_in_days',
    ];

    public function sales()
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    public function subscriptionPackage()
    {
        return $this->belongsTo(SubscriptionPackage::class);
    }
}
