<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\UnitConversion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UnitConversionController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

        $conversions = UnitConversion::where('tenant_id', $tenant->id)
            ->orderBy('base_unit')
            ->orderBy('target_unit')
            ->get();

        return Inertia::render('Owner/UnitConversions/Index', [
            'conversions' => $conversions,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

        $validated = $request->validate([
            'base_unit' => [
                'required', 'string', 'max:50',
            ],
            'target_unit' => [
                'required', 'string', 'max:50',
                Rule::unique('unit_conversions')->where(function ($query) use ($tenant, $request) {
                    return $query->where('tenant_id', $tenant->id)
                                 ->where('base_unit', $request->base_unit);
                })
            ],
            'conversion_rate' => 'required|numeric|min:0.000001',
        ]);

        $validated['tenant_id'] = $tenant->id;

        UnitConversion::create($validated);

        return redirect()->back()->with('success', 'Konversi satuan berhasil ditambahkan.');
    }

    public function update(Request $request, UnitConversion $unitConversion)
    {
        $tenant = $request->user()->tenant ?? abort(403);
        abort_unless($unitConversion->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'base_unit' => [
                'required', 'string', 'max:50',
            ],
            'target_unit' => [
                'required', 'string', 'max:50',
                Rule::unique('unit_conversions')->where(function ($query) use ($tenant, $request) {
                    return $query->where('tenant_id', $tenant->id)
                                 ->where('base_unit', $request->base_unit);
                })->ignore($unitConversion->id)
            ],
            'conversion_rate' => 'required|numeric|min:0.000001',
        ]);

        $unitConversion->update($validated);

        return redirect()->back()->with('success', 'Konversi satuan berhasil diperbarui.');
    }

    public function destroy(Request $request, UnitConversion $unitConversion)
    {
        $tenant = $request->user()->tenant ?? abort(403);
        abort_unless($unitConversion->tenant_id === $tenant->id, 403);

        $unitConversion->delete();

        return redirect()->back()->with('success', 'Konversi satuan berhasil dihapus.');
    }
}
