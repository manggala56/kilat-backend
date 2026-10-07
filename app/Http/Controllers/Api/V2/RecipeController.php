<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\RecipeItem;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    /**
     * GET /api/v2/recipes
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $recipes = RecipeItem::whereHas('product', function ($query) use ($tenant) {
            $query->where('tenant_id', $tenant->id);
        })->get();

        return response()->json([
            'status' => 'success',
            'data'   => $recipes->map(function ($r) {
                return [
                    'id'              => $r->id,
                    'product_id'      => $r->product_id,
                    'material_id'     => $r->raw_material_id,
                    'amount_required' => (float) $r->quantity,
                    'unit'            => $r->unit,
                ];
            }),
        ]);
    }
}
