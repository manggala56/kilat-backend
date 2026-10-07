<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Restock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RestockController extends Controller
{
    /**
     * GET /api/v2/restocks
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $restocks = Restock::where('tenant_id', $tenant->id)
            ->latest('restock_date')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $restocks,
        ]);
    }

    /**
     * POST /api/v2/restocks
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'product_id'      => 'nullable|integer',
            'raw_material_id' => 'nullable|integer',
            'quantity'        => 'required|numeric|min:0.01',
            'unit_cost'       => 'required|numeric|min:0',
            'total_cost'      => 'required|numeric|min:0',
            'supplier_name'   => 'nullable|string',
            'restock_date'    => 'required|date',
            'expired_date'    => 'nullable|date',
            'notes'           => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $tenant) {
            $restock = Restock::create([
                'tenant_id'       => $tenant->id,
                'product_id'      => $validated['product_id'] ?? null,
                'raw_material_id' => $validated['raw_material_id'] ?? null,
                'quantity'        => $validated['quantity'],
                'unit_cost'       => $validated['unit_cost'],
                'total_cost'      => $validated['total_cost'],
                'supplier_name'   => $validated['supplier_name'] ?? null,
                'restock_date'    => $validated['restock_date'],
                'expired_date'    => $validated['expired_date'] ?? null,
                'notes'           => $validated['notes'] ?? null,
            ]);

            // Tambah stok ke master
            if (!empty($validated['product_id'])) {
                $product = Product::where('tenant_id', $tenant->id)->where('id', $validated['product_id'])->first();
                if ($product) {
                    $product->increment('stock', $validated['quantity']);
                }
            } elseif (!empty($validated['raw_material_id'])) {
                $material = RawMaterial::where('tenant_id', $tenant->id)->where('id', $validated['raw_material_id'])->first();
                if ($material) {
                    $material->increment('stock', $validated['quantity']);
                }
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Restock berhasil disimpan.',
                'data'    => $restock,
            ], 201);
        });
    }
}
