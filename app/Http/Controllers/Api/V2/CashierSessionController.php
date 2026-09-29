<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\CashierSession;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CashierSessionController extends Controller
{
    /**
     * POST /api/v2/cashier-sessions
     * Sinkronisasi sesi kasir (buka kasir / tutup kasir) dari perangkat POS.
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validator = Validator::make($request->all(), [
            'cashier_id'           => 'required|integer',
            'clock_in_time'        => 'required|date',
            'clock_out_time'       => 'nullable|date',
            'starting_cash'        => 'nullable|numeric|min:0',
            'system_recorded_cash' => 'nullable|numeric',
            'actual_cash_input'    => 'nullable|numeric',
            'discrepancy'          => 'nullable|numeric',
            'total_transactions'   => 'nullable|integer|min:0',
            'notes'                => 'nullable|string',
            'local_id'             => 'required|integer', // ID lokal di SQLite
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data sesi kasir tidak valid.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Validasi employee terdaftar di tenant ini
        $employee = Employee::where('id', $validated['cashier_id'])
            ->where('tenant_id', $tenant->id)
            ->first();

        $cashierId = $employee ? $employee->id : null;

        $clockIn = Carbon::parse($validated['clock_in_time'])->setTimezone(config('app.timezone'));
        $clockOut = !empty($validated['clock_out_time']) 
            ? Carbon::parse($validated['clock_out_time'])->setTimezone(config('app.timezone')) 
            : null;

        // Cari apakah sesi sudah pernah di-push sebelumnya (berdasarkan tenant, cashier, dan clock_in_time)
        $session = CashierSession::where('tenant_id', $tenant->id)
            ->where('cashier_id', $cashierId)
            ->where('clock_in_time', $clockIn)
            ->first();

        if ($session) {
            $session->update([
                'clock_out_time'       => $clockOut ?: $session->clock_out_time,
                'starting_cash'        => $validated['starting_cash'] ?? $session->starting_cash,
                'system_recorded_cash' => $validated['system_recorded_cash'] ?? $session->system_recorded_cash,
                'actual_cash_input'    => $validated['actual_cash_input'] ?? $session->actual_cash_input,
                'discrepancy'          => $validated['discrepancy'] ?? $session->discrepancy,
                'total_transactions'   => $validated['total_transactions'] ?? $session->total_transactions,
                'notes'                => $validated['notes'] ?? $session->notes,
            ]);
        } else {
            $session = CashierSession::create([
                'tenant_id'            => $tenant->id,
                'cashier_id'           => $cashierId,
                'clock_in_time'        => $clockIn,
                'clock_out_time'       => $clockOut,
                'starting_cash'        => $validated['starting_cash'] ?? 0,
                'system_recorded_cash' => $validated['system_recorded_cash'] ?? null,
                'actual_cash_input'    => $validated['actual_cash_input'] ?? null,
                'discrepancy'          => $validated['discrepancy'] ?? null,
                'total_transactions'   => $validated['total_transactions'] ?? 0,
                'notes'                => $validated['notes'] ?? null,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Sesi kasir berhasil disinkronkan.',
            'data'    => [
                'server_id' => $session->id,
                'local_id'  => $validated['local_id'],
            ],
        ], 201);
    }
}
