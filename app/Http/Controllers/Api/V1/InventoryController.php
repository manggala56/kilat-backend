<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * GET /api/v1/inventory/status
     * Return current stock levels for all active products.
     */
    public function status(Request $request)
    {
        $tenant = app('tenant');

        $products = Product::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get(['id', 'name', 'sku', 'stock', 'low_stock_threshold']);

        $lowStock = $products->filter(fn ($p) => $p->stock <= $p->low_stock_threshold);

        return response()->json([
            'status' => 'success',
            'data' => [
                'inventory' => $products,
                'low_stock_count' => $lowStock->count(),
                'low_stock_items' => $lowStock->values(),
            ],
        ]);
    }

    /**
     * POST /api/v1/inventory/adjust
     * Manual stock adjustment (Stock Opname).
     */
    public function adjust(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'new_quantity' => 'required|integer|min:0',
            'type' => 'required|in:opname,restock,damage,sale_correction',
            'notes' => 'nullable|string|max:255',
        ]);

        $product = Product::where('tenant_id', $tenant->id)
            ->findOrFail($validated['product_id']);

        $quantityBefore = $product->stock;
        $quantityAfter = $validated['new_quantity'];
        $delta = $quantityAfter - $quantityBefore;

        DB::transaction(function () use ($product, $tenant, $request, $validated, $quantityBefore, $quantityAfter, $delta) {
            $product->update(['stock' => $quantityAfter]);

            InventoryAdjustment::create([
                'tenant_id' => $tenant->id,
                'product_id' => $product->id,
                'adjusted_by' => $request->user()?->id,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'quantity_delta' => $delta,
                'type' => $validated['type'],
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Stok berhasil disesuaikan.',
            'data' => [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'delta' => $delta,
            ],
        ]);
    }
}
