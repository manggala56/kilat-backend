<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function clockIn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'starting_cash' => 'required|numeric|min:0',
            'clock_in_time' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Check if already clocked in without clocking out
        $activeAttendance = Attendance::where('employee_id', $user->id)
            ->whereNull('clock_out_time')
            ->first();

        if ($activeAttendance) {
            return response()->json([
                'message' => 'You are already clocked in.'
            ], 400);
        }

        Attendance::create([
            'employee_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'clock_in_time' => Carbon::parse($request->clock_in_time),
            'starting_cash' => $request->starting_cash,
        ]);

        return response()->json([
            'message' => 'Clock in successful'
        ]);
    }

    public function clockOut(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'clock_out_time' => 'required|date',
            'system_recorded_cash' => 'required|numeric',
            'actual_cash_input' => 'required|numeric',
            'discrepancy' => 'required|numeric',
            'total_transactions' => 'required|integer',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        $activeAttendance = Attendance::where('employee_id', $user->id)
            ->whereNull('clock_out_time')
            ->first();

        if (!$activeAttendance) {
            return response()->json([
                'message' => 'No active clock-in found.'
            ], 400);
        }

        $activeAttendance->update([
            'clock_out_time' => Carbon::parse($request->clock_out_time),
            'system_recorded_cash' => $request->system_recorded_cash,
            'actual_cash_input' => $request->actual_cash_input,
            'discrepancy' => $request->discrepancy,
            'total_transactions' => $request->total_transactions,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Clock out successful'
        ]);
    }
}
