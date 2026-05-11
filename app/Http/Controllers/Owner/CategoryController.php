<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

        $categories = Category::where('tenant_id', $tenant->id)
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return Inertia::render('Owner/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Category::create([
            ...$validated,
            'tenant_id' => $tenant->id,
            'slug' => \Illuminate\Support\Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category)
    {
        $this->authorizeForTenant($request, $category);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category->update([
            ...$validated,
            'slug' => \Illuminate\Support\Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Request $request, Category $category)
    {
        $this->authorizeForTenant($request, $category);
        $category->delete();
        return back()->with('success', 'Kategori berhasil dihapus.');
    }

    private function authorizeForTenant(Request $request, Category $category): void
    {
        $tenant = $request->user()->tenant ?? abort(403);
        abort_unless($category->tenant_id === $tenant->id, 403);
    }
}
