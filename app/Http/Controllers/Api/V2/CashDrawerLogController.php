<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\CashDrawerLog;
use Illuminate\Http\Request;

class CashDrawerLogController extends Controller
{
    /**
     * POST /api/v2/cash-drawer-logs
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'employee_id' => 'nullable|integer',
            'reason'      => 'required|string',
            'opened_at'   => 'required|date',
        ]);

        $log = CashDrawerLog::create([
            'tenant_id'   => $tenant->id,
            'employee_id' => $validated['employee_id'] ?? null,
            'reason'      => $validated['reason'],
            'opened_at'   => $validated['opened_at'],
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cash drawer log synced.',
            'data'    => $log,
        ], 201);
    }
}
