<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CashierSession;
use Illuminate\Http\Request;

class CashierSessionController extends Controller
{
    /**
     * POST /api/v1/cashier-sessions
     * Receive cashier session sync data from POS
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'cashier_id' => 'required|integer|exists:users,id',
            'clock_in_time' => 'required|date',
            'clock_out_time' => 'nullable|date',
            'starting_cash' => 'nullable|numeric',
            'system_recorded_cash' => 'nullable|numeric',
            'actual_cash_input' => 'nullable|numeric',
            'discrepancy' => 'nullable|numeric',
            'total_transactions' => 'nullable|integer',
            'notes' => 'nullable|string',
            'local_id' => 'required|integer', // From SQLite
        ]);

        // Create the session
        $session = CashierSession::create([
            'tenant_id' => $tenant->id,
            'cashier_id' => $validated['cashier_id'],
            'clock_in_time' => $validated['clock_in_time'],
            'clock_out_time' => $validated['clock_out_time'],
            'starting_cash' => $validated['starting_cash'] ?? 0,
            'system_recorded_cash' => $validated['system_recorded_cash'],
            'actual_cash_input' => $validated['actual_cash_input'],
            'discrepancy' => $validated['discrepancy'],
            'total_transactions' => $validated['total_transactions'] ?? 0,
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'data' => [
                'server_id' => $session->id,
                'local_id' => $validated['local_id']
            ],
            'message' => 'Cashier session synced successfully'
        ], 201);
    }
}
