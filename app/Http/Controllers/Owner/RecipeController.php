<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RecipeItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $query = Product::with(['category', 'recipeItems.rawMaterial'])->where('tenant_id', $tenant->id);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $products = $query->orderBy('name')->paginate(10)->withQueryString();
        
        // HPP dipanggil otomatis via accessor $appends = ['hpp'] di model Product
        $rawMaterials = RawMaterial::where('tenant_id', $tenant->id)->where('is_active', true)->get();

        return Inertia::render('Owner/Products/Recipes', [
            'products' => $products,
            'rawMaterials' => $rawMaterials,
            'filters' => $request->only('search')
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($product->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'recipe_items' => 'array',
            'recipe_items.*.raw_material_id' => 'required|exists:raw_materials,id',
            'recipe_items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        DB::beginTransaction();
        try {
            // Delete existing recipe items
            $product->recipeItems()->delete();

            // Insert new recipe items
            if (!empty($validated['recipe_items'])) {
                $items = array_map(function ($item) use ($product) {
                    return [
                        'product_id' => $product->id,
                        'raw_material_id' => $item['raw_material_id'],
                        'quantity' => $item['quantity'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }, $validated['recipe_items']);
                
                RecipeItem::insert($items);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Resep berhasil diperbarui. HPP telah dikalkulasi ulang.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat menyimpan resep.']);
        }
    }
}
