<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /**
     * Live Inventory Tracker — show all products with current stock levels.
     */
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

        $products = Product::with('category:id,name')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->orderBy('stock')
            ->get(['id', 'category_id', 'name', 'sku', 'stock', 'low_stock_threshold', 'price']);

        $recentAdjustments = InventoryAdjustment::with('product:id,name', 'adjustedBy:id,name')
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return Inertia::render('Owner/Inventory/Index', [
            'products' => $products,
            'recentAdjustments' => $recentAdjustments,
            'lowStockCount' => $products->filter(fn ($p) => $p->stock <= $p->low_stock_threshold)->count(),
        ]);
    }

    /**
     * Stock Opname — manual stock adjustment.
     */
    public function adjust(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

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
                'adjusted_by' => $request->user()->id,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'quantity_delta' => $delta,
                'type' => $validated['type'],
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return back()->with('success', "Stok '{$product->name}' berhasil disesuaikan dari {$quantityBefore} ke {$quantityAfter}.");
    }
}
