<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CashDrawerLog;
use Illuminate\Http\Request;

class CashDrawerLogController extends Controller
{
    public function store(Request $request)
    {
        $tenantId = request()->attributes->get('tenant_id');

        $validated = $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'reason' => 'required|string',
            'opened_at' => 'required|date',
        ]);

        $log = CashDrawerLog::create([
            'tenant_id' => $tenantId,
            'employee_id' => $validated['employee_id'],
            'reason' => $validated['reason'],
            'opened_at' => \Carbon\Carbon::parse($validated['opened_at'])->setTimezone('Asia/Jakarta'),
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $log
        ], 201);
    }
}
