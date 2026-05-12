<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'tenant_id', 'category_id', 'name', 'sku', 'description',
        'image', 'price', 'stock', 'low_stock_threshold',
        'is_active', 'has_variants',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'has_variants' => 'boolean',
    ];

    protected $appends = ['hpp'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function recipeItems(): HasMany
    {
        return $this->hasMany(RecipeItem::class);
    }

    public function getHppAttribute()
    {
        // Jika produk memiliki resep, HPP adalah total dari (quantity * cost_per_unit)
        if ($this->relationLoaded('recipeItems') || $this->recipeItems()->exists()) {
            return $this->recipeItems->sum(function ($item) {
                return $item->quantity * ($item->rawMaterial ? $item->rawMaterial->cost_per_unit : 0);
            });
        }
        
        return 0;
    }

    public function inventoryAdjustments(): HasMany
    {
        return $this->hasMany(InventoryAdjustment::class);
    }

    public function transactionItems(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
