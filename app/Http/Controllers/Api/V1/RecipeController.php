<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RecipeItem;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $recipes = RecipeItem::whereHas('product', function($q) use ($tenant) {
            $q->where('tenant_id', $tenant->id);
        })
        ->get()
        ->map(function ($item) {
            return [
                'product_id' => $item->product_id,
                'material_id' => $item->raw_material_id,
                'amount_required' => (float) $item->quantity
            ];
        });

        return response()->json([
            'data' => $recipes
        ]);
    }
}
