<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    /**
     * GET /api/v1/catalog/sync
     * Pull all categories, products & variants for offline cache.
     */
    public function sync(Request $request)
    {
        $tenant = app('tenant');

        $categories = Category::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get(['id', 'name', 'slug']);

        $products = Product::with('variants:id,product_id,name,additional_price,stock,sku')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get([
                'id', 'category_id', 'name', 'sku', 'image',
                'price', 'stock', 'has_variants', 'description',
            ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'categories' => $categories,
                'products' => $products,
                'synced_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * POST /api/v1/catalog/products
     * Create a new product.
     */
    public function storeProduct(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'sku' => 'nullable|string|unique:products,sku',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'has_variants' => 'boolean',
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string',
            'variants.*.additional_price' => 'required|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
        ]);

        $product = Product::create([
            ...$validated,
            'tenant_id' => $tenant->id,
            'sku' => $validated['sku'] ?? 'SKU-' . strtoupper(Str::random(8)),
        ]);

        if (!empty($validated['variants'])) {
            foreach ($validated['variants'] as $variant) {
                $product->variants()->create($variant);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil ditambahkan.',
            'data' => $product->load('variants'),
        ], 201);
    }

    /**
     * PUT /api/v1/catalog/products/{id}
     * Update a product.
     */
    public function updateProduct(Request $request, int $id)
    {
        $tenant = app('tenant');

        $product = Product::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'sku' => 'nullable|string|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'has_variants' => 'boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product->load('variants'),
        ]);
    }
}
