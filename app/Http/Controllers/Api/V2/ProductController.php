<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * GET /api/v2/products
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $products = Product::with(['category', 'recipeItems.rawMaterial'])
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $products->map(function ($p) {
                return [
                    'id'          => $p->id,
                    'name'        => $p->name,
                    'sku'         => $p->sku,
                    'price'       => (float) $p->price,
                    'stock'       => (int) $p->stock,
                    'category'    => $p->category ? $p->category->name : null,
                    'category_id' => $p->category_id,
                    'image_uri'   => $p->image_uri,
                    'is_active'   => (bool) $p->is_active,
                ];
            }),
        ]);
    }

    /**
     * POST /api/v2/products
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'price'       => 'required|numeric|min:0',
            'category_id' => 'nullable|integer',
            'sku'         => 'nullable|string',
            'stock'       => 'nullable|integer|min:0',
            'image_uri'   => 'nullable|string',
        ]);

        $product = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => $validated['name'],
            'price'       => $validated['price'],
            'category_id' => $validated['category_id'] ?? null,
            'sku'         => $validated['sku'] ?? null,
            'stock'       => $validated['stock'] ?? 0,
            'image_uri'   => $validated['image_uri'] ?? null,
            'is_active'   => true,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Produk berhasil ditambahkan.',
            'data'    => $product,
        ], 201);
    }
}
