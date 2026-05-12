<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * GET /api/v1/categories
     * Ambil semua kategori milik tenant.
     */
    public function index()
    {
        $tenant = app('tenant');

        $categories = Category::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get()
            ->map(fn ($c) => $this->formatCategory($c));

        return response()->json(['data' => $categories]);
    }

    /**
     * POST /api/v1/categories
     * Tambah kategori baru.
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:FOOD,DRINK,OTHER',
            'icon' => 'nullable|string',
        ]);

        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name'      => $validated['name'],
            'slug'      => \Illuminate\Support\Str::slug($validated['name']),
            'type'      => $validated['type'],
            'icon'      => $validated['icon'] ?? null,
        ]);

        return response()->json([
            'data'    => $this->formatCategory($category),
            'message' => 'Category created successfully',
        ], 201);
    }

    /**
     * PUT /api/v1/categories/{id}
     * Update kategori.
     */
    public function update(Request $request, $id)
    {
        $tenant = app('tenant');

        $category = Category::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:FOOD,DRINK,OTHER',
            'icon' => 'nullable|string',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json([
            'data'    => $this->formatCategory($category->refresh()),
            'message' => 'Category updated successfully',
        ]);
    }

    /**
     * DELETE /api/v1/categories/{id}
     * Hapus kategori (hard delete, karena tidak ada foreign key yang blocking).
     */
    public function destroy($id)
    {
        $tenant = app('tenant');

        $category = Category::where('tenant_id', $tenant->id)->findOrFail($id);
        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully',
        ]);
    }

    /**
     * Format kategori sesuai response Modul 4.
     */
    private function formatCategory(Category $category): array
    {
        return [
            'id'   => $category->id,
            'name' => $category->name,
            'type' => $category->type ?? 'OTHER',
            'icon' => $category->icon,
        ];
    }
}
