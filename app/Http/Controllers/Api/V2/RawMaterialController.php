<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use Illuminate\Http\Request;

class RawMaterialController extends Controller
{
    /**
     * GET /api/v2/materials
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $materials = RawMaterial::where('tenant_id', $tenant->id)->get();

        return response()->json([
            'status' => 'success',
            'data'   => $materials->map(function ($m) {
                return [
                    'id'            => $m->id,
                    'name'          => $m->name,
                    'unit'          => $m->unit,
                    'current_stock' => (float) $m->stock,
                    'min_stock'     => (float) $m->min_stock,
                ];
            }),
        ]);
    }
}
