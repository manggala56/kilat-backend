<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $payrolls = Payroll::with('employee')
            ->where('tenant_id', $tenant->id)
            ->when($request->search, function ($q, $search) {
                $q->whereHas('employee', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('period_start')
            ->paginate(20)
            ->withQueryString();
            
        $employees = Employee::where('tenant_id', $tenant->id)->get(['id', 'name']);

        return Inertia::render('Owner/HR/Payroll', [
            'payrolls' => $payrolls,
            'employees' => $employees,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'base_salary' => 'required|numeric|min:0',
            'attendance_bonus' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,paid',
        ]);
        
        $attendanceBonus = $validated['attendance_bonus'] ?? 0;
        $deductions = $validated['deductions'] ?? 0;
        $netSalary = $validated['base_salary'] + $attendanceBonus - $deductions;
        
        Payroll::create([
            ...$validated,
            'attendance_bonus' => $attendanceBonus,
            'deductions' => $deductions,
            'net_salary' => $netSalary,
            'tenant_id' => $tenant->id,
        ]);

        return back()->with('success', 'Payroll berhasil di-generate.');
    }

    public function update(Request $request, Payroll $payroll)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($payroll->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'status' => 'required|in:pending,paid',
        ]);

        $payroll->update($validated);

        return back()->with('success', 'Status payroll berhasil diperbarui.');
    }

    public function destroy(Request $request, Payroll $payroll)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($payroll->tenant_id === $tenant->id, 403);

        $payroll->delete();

        return back()->with('success', 'Payroll berhasil dihapus.');
    }
}
