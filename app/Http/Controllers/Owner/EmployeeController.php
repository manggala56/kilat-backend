<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);

        $employees = Employee::where('tenant_id', $tenant->id)
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('username', 'like', "%{$request->search}%"))
            ->when($request->role, fn ($q) => $q->where('role', $request->role))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Owner/Employees/Index', [
            'employees' => $employees,
            'filters'   => $request->only('search', 'role'),
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);

        $validated = $request->validate([
            'name'      => 'required|string|min:2|max:255',
            'username'  => [
                'required',
                'string',
                'min:3',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('employees')->where(fn ($q) => $q->where('outlet_id', $tenant->id)),
            ],
            'pin_code'  => 'required|string|digits_between:4,6',
            'role'      => 'required|string|in:CASHIER,SUPERVISOR,OWNER',
        ], [
            'username.regex'          => 'Username hanya huruf kecil, angka, dan underscore.',
            'username.unique'         => 'Username sudah digunakan di outlet ini.',
            'pin_code.digits_between' => 'PIN harus 4-6 digit numerik.',
        ]);

        Employee::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $tenant->id,
            'name'      => $validated['name'],
            'username'  => $validated['username'],
            'pin_code'  => Hash::make($validated['pin_code']),
            'role'      => $validated['role'],
        ]);

        return back()->with('success', 'Karyawan berhasil ditambahkan.');
    }

    public function update(Request $request, Employee $employee)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($employee->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'name'     => 'sometimes|string|min:2|max:255',
            'role'     => 'sometimes|string|in:CASHIER,SUPERVISOR,OWNER',
            'pin_code' => 'nullable|string|digits_between:4,6',
            'is_active'=> 'boolean',
        ]);

        if (!empty($validated['pin_code'])) {
            $validated['pin_code'] = Hash::make($validated['pin_code']);
        } else {
            unset($validated['pin_code']);
        }

        $employee->update($validated);

        return back()->with('success', 'Data karyawan berhasil diperbarui.');
    }

    public function destroy(Request $request, Employee $employee)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($employee->tenant_id === $tenant->id, 403);

        // Soft-deactivate (tidak hapus permanen)
        $employee->update(['is_active' => false]);

        return back()->with('success', 'Karyawan berhasil dinonaktifkan.');
    }
}
