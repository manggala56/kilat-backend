<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use Illuminate\Http\Request;

class RawMaterialController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $materials = RawMaterial::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get()
            ->map(function ($material) {
                return [
                    'id' => $material->id,
                    'name' => $material->name,
                    'unit' => $material->unit ?? 'unit',
                    'current_stock' => (float) $material->stock,
                    'min_stock' => (float) ($material->min_stock ?? 0)
                ];
            });

        return response()->json([
            'data' => $materials
        ]);
    }
}
