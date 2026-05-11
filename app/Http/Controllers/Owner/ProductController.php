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
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('sku', 'like', "%{$request->search}%"))
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
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
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'has_variants' => 'boolean',
            'image' => 'nullable|image|max:2048',
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string',
            'variants.*.additional_price' => 'required|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store("tenants/{$tenant->id}/products", 'public');
        }

        $product = Product::create([
            ...$validated,
            'tenant_id' => $tenant->id,
            'sku' => $validated['sku'] ?? 'SKU-' . strtoupper(Str::random(8)),
            'image' => $imagePath,
        ]);

        if (!empty($validated['variants'])) {
            foreach ($validated['variants'] as $variant) {
                $product->variants()->create($variant);
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
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store("tenants/{$tenant->id}/products", 'public');
        }

        $product->update($validated);

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
