<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $shifts = Shift::where('tenant_id', $tenant->id)
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Owner/HR/Shifts', [
            'shifts' => $shifts,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
        ]);
        
        Shift::create([
            ...$validated,
            'tenant_id' => $tenant->id,
        ]);

        return back()->with('success', 'Shift berhasil ditambahkan.');
    }

    public function update(Request $request, Shift $shift)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($shift->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
        ]);

        $shift->update($validated);

        return back()->with('success', 'Shift berhasil diperbarui.');
    }

    public function destroy(Request $request, Shift $shift)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($shift->tenant_id === $tenant->id, 403);

        $shift->delete();

        return back()->with('success', 'Shift berhasil dihapus.');
    }
}
