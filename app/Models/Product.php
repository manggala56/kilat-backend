<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'tenant_id', 'category_id', 'name', 'sku', 'description',
        'image', 'cost_price', 'price', 'margin_percentage', 'stock', 'low_stock_threshold',
        'is_active', 'has_variants',
        'is_available_online', 'is_best_seller', 'prep_time_minutes', 'tags', 'calories',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'price' => 'decimal:2',
        'margin_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'has_variants' => 'boolean',
        'is_available_online' => 'boolean',
        'is_best_seller' => 'boolean',
        'prep_time_minutes' => 'integer',
        'tags' => 'array',
    ];

    protected $appends = ['hpp', 'recipe_hpp', 'image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        // Auto-convert Google Drive Share links to Direct Google CDN URLs
        if (str_contains($this->image, 'drive.google.com')) {
            if (preg_match('/\/file\/d\/([a-zA-Z0-9_-]+)/', $this->image, $matches)) {
                return "https://lh3.googleusercontent.com/d/{$matches[1]}";
            }
            if (preg_match('/[?&]id=([a-zA-Z0-9_-]+)/', $this->image, $matches)) {
                return "https://lh3.googleusercontent.com/d/{$matches[1]}";
            }
        }

        if (str_starts_with($this->image, 'http://') || str_starts_with($this->image, 'https://')) {
            return $this->image;
        }

        return asset('storage/' . $this->image);
    }

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

    public function getRecipeHppAttribute(): float
    {
        if ($this->relationLoaded('recipeItems')) {
            return (float) $this->recipeItems->sum(function ($item) {
                return ($item->quantity ?? 0) * ($item->rawMaterial?->cost_per_unit ?? 0);
            });
        }
        
        if ($this->recipeItems()->exists()) {
            return (float) $this->recipeItems()->with('rawMaterial')->get()->sum(function ($item) {
                return ($item->quantity ?? 0) * ($item->rawMaterial?->cost_per_unit ?? 0);
            });
        }

        return 0.0;
    }

    public function getHppAttribute(): float
    {
        $recipeHpp = $this->recipe_hpp;
        if ($recipeHpp > 0) {
            return $recipeHpp;
        }

        return (float) ($this->cost_price ?? 0);
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
