<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

        $products = Product::with('category:id,name', 'variants')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('sku', 'like', "%{$request->search}%"))
            ->when($request->category_id && $request->category_id !== 'all', fn ($q) => $q->where('category_id', $request->category_id))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $categories = Category::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get(['id', 'name']);

        return Inertia::render('Owner/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only('search', 'category_id'),
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'sku' => 'nullable|string|unique:products,sku',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'margin_percentage' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'has_variants' => 'boolean',
            'is_available_online' => 'boolean',
            'is_best_seller' => 'boolean',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'tags' => 'nullable|array',
            'calories' => 'nullable|string|max:50',
            'image' => 'nullable|image|max:2048',
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string|max:100',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.additional_price' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'nullable|integer|min:0',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store("tenants/{$tenant->id}/products", 'public');
        }

        $hasVariants = $request->boolean('has_variants') && !empty($validated['variants']);
        $productSku = !empty($validated['sku']) ? strtoupper($validated['sku']) : 'SKU-' . strtoupper(Str::random(8));

        $totalStock = (int)($validated['stock'] ?? 0);
        if ($hasVariants) {
            $totalStock = collect($validated['variants'])->sum(fn($v) => (int)($v['stock'] ?? 0));
        }

        $productData = [
            ...$validated,
            'tenant_id' => $tenant->id,
            'sku' => $productSku,
            'image' => $imagePath,
            'stock' => $totalStock,
            'has_variants' => $hasVariants,
            'is_available_online' => $request->boolean('is_available_online', true),
            'is_best_seller' => $request->boolean('is_best_seller', false),
            'prep_time_minutes' => $validated['prep_time_minutes'] ?? 10,
            'tags' => $validated['tags'] ?? [],
        ];

        // Hitung harga dari margin persentase jika ada (catatan: produk baru belum punya resep)
        $marginPercentage = $request->input('margin_percentage');
        if ($marginPercentage !== null && $marginPercentage !== '') {
            $hpp = 0; // Karena produk baru belum punya recipeItems
            $productData['price'] = $hpp + ($hpp * ($marginPercentage / 100));
        } elseif (!isset($productData['price'])) {
            $productData['price'] = 0;
        }

        $product = Product::create($productData);

        if ($hasVariants) {
            foreach ($validated['variants'] as $v) {
                $varSku = !empty($v['sku']) 
                    ? strtoupper($v['sku']) 
                    : $product->sku . '-' . strtoupper(Str::slug($v['name'], ''));
                
                $product->variants()->create([
                    'name' => $v['name'],
                    'sku' => $varSku,
                    'additional_price' => $v['additional_price'] ?? 0,
                    'stock' => $v['stock'] ?? 0,
                    'is_active' => true,
                ]);
            }
        }

        return back()->with('success', 'Produk berhasil ditambahkan.');
    }

    public function update(Request $request, Product $product)
    {
        $tenant = $request->user()->tenant ?? abort(403);
        abort_unless($product->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'sku' => 'nullable|string|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'price' => 'sometimes|nullable|numeric|min:0',
            'margin_percentage' => 'nullable|numeric|min:0',
            'stock' => 'sometimes|nullable|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'is_active' => 'nullable',
            'has_variants' => 'nullable',
            'is_available_online' => 'nullable',
            'is_best_seller' => 'nullable',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'tags' => 'nullable|array',
            'calories' => 'nullable|string|max:50',
            'image' => 'nullable|image|max:3072',
            'variants' => 'nullable|array',
            'variants.*.id' => 'nullable|integer',
            'variants.*.name' => 'required|string|max:100',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.additional_price' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'nullable|integer|min:0',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store("tenants/{$tenant->id}/products", 'public');
        } else {
            unset($validated['image']);
        }

        if ($request->has('has_variants')) {
            $validated['has_variants'] = $request->boolean('has_variants');
        }
        if ($request->has('is_available_online')) {
            $validated['is_available_online'] = $request->boolean('is_available_online');
        }
        if ($request->has('is_best_seller')) {
            $validated['is_best_seller'] = $request->boolean('is_best_seller');
        }
        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }

        $marginPercentage = $request->input('margin_percentage');
        if ($marginPercentage !== null && $marginPercentage !== '') {
            $hpp = $product->hpp ?? 0;
            $validated['price'] = $hpp + ($hpp * ($marginPercentage / 100));
        }

        if (isset($validated['sku'])) {
            $validated['sku'] = strtoupper($validated['sku']);
        }

        $hasVariants = isset($validated['has_variants']) ? (bool)$validated['has_variants'] : $product->has_variants;
        $variantsData = $validated['variants'] ?? null;

        if ($hasVariants && is_array($variantsData)) {
            $validated['has_variants'] = count($variantsData) > 0;
            $validated['stock'] = collect($variantsData)->sum(fn($v) => (int)($v['stock'] ?? 0));
        }

        $product->update($validated);

        // Sync variants
        if ($hasVariants && is_array($variantsData)) {
            $keptVariantIds = [];
            $baseSku = $product->sku ?: 'SKU-' . $product->id;

            foreach ($variantsData as $v) {
                $varSku = !empty($v['sku']) 
                    ? strtoupper($v['sku']) 
                    : $baseSku . '-' . strtoupper(Str::slug($v['name'], ''));

                if (!empty($v['id'])) {
                    $existingVariant = $product->variants()->find($v['id']);
                    if ($existingVariant) {
                        $existingVariant->update([
                            'name' => $v['name'],
                            'sku' => $varSku,
                            'additional_price' => $v['additional_price'] ?? 0,
                            'stock' => $v['stock'] ?? 0,
                            'is_active' => true,
                        ]);
                        $keptVariantIds[] = $existingVariant->id;
                        continue;
                    }
                }

                // Create new variant
                $newVariant = $product->variants()->create([
                    'name' => $v['name'],
                    'sku' => $varSku,
                    'additional_price' => $v['additional_price'] ?? 0,
                    'stock' => $v['stock'] ?? 0,
                    'is_active' => true,
                ]);
                $keptVariantIds[] = $newVariant->id;
            }

            // Remove omitted variants
            $product->variants()->whereNotIn('id', $keptVariantIds)->delete();
        } elseif (!$hasVariants && isset($validated['has_variants'])) {
            $product->variants()->delete();
        }

        return back()->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Request $request, Product $product)
    {
        $tenant = $request->user()->tenant ?? abort(403);
        abort_unless($product->tenant_id === $tenant->id, 403);

        $product->update(['is_active' => false]);

        return back()->with('success', 'Produk berhasil dinonaktifkan.');
    }
}
