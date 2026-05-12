<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * GET /api/v1/products
     * Ambil semua produk aktif milik tenant.
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $products = Product::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->with('category:id,name')
            ->get()
            ->map(fn ($p) => $this->formatProduct($p));

        return response()->json(['data' => $products]);
    }

    /**
     * POST /api/v1/products
     * Tambah produk baru.
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'sku'        => 'nullable|string',
            'price'      => 'required|numeric|min:0',
            'stock'      => 'required|integer|min:0',
            'category'   => 'nullable|string',
            'image_uri'  => 'nullable|string',
            'is_active'  => 'boolean',
        ]);

        // Resolve category by name jika ada
        $categoryId = null;
        if (!empty($validated['category'])) {
            $cat = \App\Models\Category::where('tenant_id', $tenant->id)
                ->where('name', $validated['category'])
                ->first();
            $categoryId = $cat?->id;
        }

        $product = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => $validated['name'],
            'sku'         => $validated['sku'] ?? null,
            'price'       => $validated['price'],
            'stock'       => $validated['stock'],
            'category_id' => $categoryId,
            'image'       => $validated['image_uri'] ?? null,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'data'    => $this->formatProduct($product->load('category')),
            'message' => 'Product created successfully',
        ], 201);
    }

    /**
     * PUT /api/v1/products/{id}
     * Update produk.
     */
    public function update(Request $request, $id)
    {
        $tenant = app('tenant');

        $product = Product::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'sku'       => 'nullable|string',
            'price'     => 'sometimes|numeric|min:0',
            'stock'     => 'sometimes|integer|min:0',
            'category'  => 'nullable|string',
            'image_uri' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if (array_key_exists('category', $validated)) {
            if ($validated['category']) {
                $cat = \App\Models\Category::where('tenant_id', $tenant->id)
                    ->where('name', $validated['category'])
                    ->first();
                $validated['category_id'] = $cat?->id;
            } else {
                $validated['category_id'] = null;
            }
            unset($validated['category']);
        }

        if (array_key_exists('image_uri', $validated)) {
            $validated['image'] = $validated['image_uri'];
            unset($validated['image_uri']);
        }

        $product->update($validated);

        return response()->json([
            'data'    => $this->formatProduct($product->refresh()->load('category')),
            'message' => 'Product updated successfully',
        ]);
    }

    /**
     * DELETE /api/v1/products/{id}
     * Soft delete — set is_active = 0.
     */
    public function destroy(Request $request, $id)
    {
        $tenant = app('tenant');

        $product = Product::where('tenant_id', $tenant->id)->findOrFail($id);
        $product->update(['is_active' => false]);

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }

    /**
     * Format product sesuai response Modul 4.
     */
    private function formatProduct(Product $product): array
    {
        return [
            'id'        => $product->id,
            'name'      => $product->name,
            'sku'       => $product->sku,
            'price'     => (float) $product->price,
            'stock'     => (int) $product->stock,
            'category'  => $product->category?->name,
            'image_uri' => $product->image,
            'is_active' => $product->is_active ? 1 : 0,
        ];
    }
}
