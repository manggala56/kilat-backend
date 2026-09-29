<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * GET /api/v2/categories
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $categories = Category::where('tenant_id', $tenant->id)
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $categories->map(function ($c) {
                return [
                    'id'   => $c->id,
                    'name' => $c->name,
                    'type' => $c->type ?? 'OTHER',
                    'icon' => $c->icon,
                ];
            }),
        ]);
    }

    /**
     * POST /api/v2/categories
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string',
            'icon' => 'nullable|string',
        ]);

        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name'      => $validated['name'],
            'type'      => $validated['type'] ?? 'OTHER',
            'icon'      => $validated['icon'] ?? null,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Kategori berhasil ditambahkan.',
            'data'    => $category,
        ], 201);
    }
}
