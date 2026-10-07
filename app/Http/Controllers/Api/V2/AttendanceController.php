<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    /**
     * POST /api/v2/attendance/clock-in
     */
    public function clockIn(Request $request)
    {
        $tenant = app('tenant');

        $validator = Validator::make($request->all(), [
            'employee_id'   => 'required|integer',
            'starting_cash' => 'required|numeric|min:0',
            'clock_in_time' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data clock in tidak valid.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $employee = Employee::where('id', $request->employee_id)
            ->where('tenant_id', $tenant->id)
            ->first();

        if (! $employee) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Karyawan tidak ditemukan di outlet ini.',
            ], 404);
        }

        // Cek apakah ada attendance aktif yang belum clock out
        $activeAttendance = Attendance::where('employee_id', $employee->id)
            ->where('tenant_id', $tenant->id)
            ->whereNull('clock_out_time')
            ->first();

        if ($activeAttendance) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Karyawan sudah melakukan clock in sebelumnya.',
            ], 400);
        }

        $attendance = Attendance::create([
            'employee_id'   => $employee->id,
            'tenant_id'     => $tenant->id,
            'clock_in_time' => Carbon::parse($request->clock_in_time)->setTimezone(config('app.timezone')),
            'starting_cash' => $request->starting_cash,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Clock in berhasil.',
            'data'    => $attendance,
        ], 201);
    }

    /**
     * POST /api/v2/attendance/clock-out
     */
    public function clockOut(Request $request)
    {
        $tenant = app('tenant');

        $validator = Validator::make($request->all(), [
            'employee_id'          => 'required|integer',
            'clock_out_time'       => 'required|date',
            'system_recorded_cash' => 'required|numeric',
            'actual_cash_input'    => 'required|numeric',
            'discrepancy'          => 'required|numeric',
            'total_transactions'   => 'required|integer',
            'notes'                => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data clock out tidak valid.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $activeAttendance = Attendance::where('employee_id', $request->employee_id)
            ->where('tenant_id', $tenant->id)
            ->whereNull('clock_out_time')
            ->latest('clock_in_time')
            ->first();

        if (! $activeAttendance) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tidak ditemukan sesi clock in aktif.',
            ], 400);
        }

        $activeAttendance->update([
            'clock_out_time'       => Carbon::parse($request->clock_out_time)->setTimezone(config('app.timezone')),
            'system_recorded_cash' => $request->system_recorded_cash,
            'actual_cash_input'    => $request->actual_cash_input,
            'discrepancy'          => $request->discrepancy,
            'total_transactions'   => $request->total_transactions,
            'notes'                => $request->notes,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Clock out / Tutup kasir berhasil dicatat.',
            'data'    => $activeAttendance,
        ]);
    }
}
