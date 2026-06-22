<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Restock;
use App\Models\Product;
use App\Models\RawMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RestockController extends Controller
{
    /**
     * GET /api/v1/restocks
     * Fetch restock history
     */
    public function index()
    {
        $tenant = app('tenant');
        $restocks = Restock::where('tenant_id', $tenant->id)
            ->orderBy('restock_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $restocks
        ]);
    }

    /**
     * POST /api/v1/restocks
     * Store new restock from mobile app and update stock.
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'product_id'      => 'nullable|integer|exists:products,id',
            'raw_material_id' => 'nullable|integer|exists:raw_materials,id',
            'quantity'        => 'required|numeric|min:0.01',
            'unit_cost'       => 'nullable|numeric|min:0',
            'total_cost'      => 'required|numeric|min:0',
            'supplier_name'   => 'nullable|string',
            'restock_date'    => 'required|date',
            'expired_date'    => 'nullable|date',
            'notes'           => 'nullable|string',
        ]);

        if (empty($validated['product_id']) && empty($validated['raw_material_id'])) {
            return response()->json(['message' => 'Tentukan product_id atau raw_material_id'], 422);
        }

        DB::beginTransaction();
        try {
            // 1. Catat Restock
            $restock = Restock::create([
                'tenant_id'       => $tenant->id,
                'product_id'      => $validated['product_id'] ?? null,
                'raw_material_id' => $validated['raw_material_id'] ?? null,
                'quantity'        => $validated['quantity'],
                'unit_cost'       => $validated['unit_cost'] ?? 0,
                'total_cost'      => $validated['total_cost'],
                'supplier_name'   => $validated['supplier_name'] ?? null,
                'restock_date'    => $validated['restock_date'],
                'expired_date'    => $validated['expired_date'] ?? null,
                'notes'           => $validated['notes'] ?? null,
            ]);

            // 2. Tambah Stok
            if (!empty($validated['product_id'])) {
                $product = Product::where('id', $validated['product_id'])
                    ->where('tenant_id', $tenant->id)->firstOrFail();
                $product->increment('stock', $validated['quantity']);
            }

            if (!empty($validated['raw_material_id'])) {
                $material = RawMaterial::where('id', $validated['raw_material_id'])
                    ->where('tenant_id', $tenant->id)->firstOrFail();
                $material->increment('stock', $validated['quantity']);
            }

            // 3. Catat juga sebagai Pengeluaran (Opsional, agar masuk ke laporan keuangan kas)
            // Uncomment if restock should automatically create an Expense
            /*
            \App\Models\Expense::create([
                'tenant_id' => $tenant->id,
                'name' => 'Restock: ' . ($product->name ?? $material->name),
                'category' => 'RESTOCK',
                'amount' => $validated['total_cost'],
                'expense_date' => $validated['restock_date'],
                'description' => 'Otomatis dari sistem restock barang.',
            ]);
            */

            DB::commit();

            return response()->json([
                'message' => 'Restock berhasil dicatat',
                'data'    => $restock
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mencatat restock: ' . $e->getMessage()], 500);
        }
    }
}
