<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $attendances = Attendance::with(['employee', 'shift'])
            ->where('tenant_id', $tenant->id)
            ->when($request->search, function ($q, $search) {
                $q->whereHas('employee', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Owner/HR/Attendance', [
            'attendances' => $attendances,
            'filters' => $request->only('search'),
        ]);
    }
}
