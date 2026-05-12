<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RawMaterialController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        $query = RawMaterial::where('tenant_id', $tenant->id);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $rawMaterials = $query->orderBy('name')->paginate(10)->withQueryString();

        return Inertia::render('Owner/RawMaterials/Index', [
            'rawMaterials' => $rawMaterials,
            'filters'      => $request->only('search'),
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'unit' => 'required|string|max:50',
            'stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $validated['tenant_id'] = $tenant->id;

        RawMaterial::create($validated);

        return redirect()->back()->with('success', 'Bahan baku berhasil ditambahkan.');
    }

    public function update(Request $request, RawMaterial $rawMaterial)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($rawMaterial->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'unit' => 'required|string|max:50',
            'stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $rawMaterial->update($validated);

        return redirect()->back()->with('success', 'Bahan baku berhasil diperbarui.');
    }

    public function destroy(Request $request, RawMaterial $rawMaterial)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($rawMaterial->tenant_id === $tenant->id, 403);

        $rawMaterial->delete();

        return redirect()->back()->with('success', 'Bahan baku berhasil dihapus.');
    }
}
