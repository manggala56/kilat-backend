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
        
        $currentMonth = $request->month ? date('m', strtotime($request->month)) : date('m');
        $currentYear = $request->month ? date('Y', strtotime($request->month)) : date('Y');

        $attendances = Attendance::with(['employee', 'shift'])
            ->where('tenant_id', $tenant->id)
            ->when($request->search, function ($q, $search) {
                $q->whereHas('employee', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->when($request->month, function ($q) use ($currentMonth, $currentYear) {
                $q->whereMonth('created_at', $currentMonth)
                  ->whereYear('created_at', $currentYear);
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_present' => Attendance::where('tenant_id', $tenant->id)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->where('status', 'present')
                ->count(),
            'total_late' => Attendance::where('tenant_id', $tenant->id)
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->where('status', 'late')
                ->count(),
        ];

        return Inertia::render('Owner/HR/Attendance', [
            'attendances' => $attendances,
            'stats' => $stats,
            'filters' => $request->only('search', 'month'),
        ]);
    }
}
