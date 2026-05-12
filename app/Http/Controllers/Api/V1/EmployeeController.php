<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Employee;

class EmployeeController extends Controller
{
    /**
     * GET /api/v1/employees
     * List semua employee milik tenant.
     * Hanya OWNER dan SUPERVISOR yang bisa akses.
     */
    public function index()
    {
        $tenant   = app('tenant');
        $employee = auth('sanctum')->user();

        // Role check — hanya OWNER & SUPERVISOR
        if (! in_array($employee->role ?? null, ['OWNER', 'SUPERVISOR'])) {
            return response()->json([
                'message' => 'Akses ditolak. Role Anda tidak memiliki izin.',
            ], 403);
        }

        $employees = Employee::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get()
            ->map(fn ($e) => [
                'id'       => $e->id,
                'name'     => $e->name,
                'username' => $e->username,
                'role'     => $e->role,
                'pin'      => null, // Tidak pernah expose PIN
            ]);

        return response()->json(['data' => $employees]);
    }
}
