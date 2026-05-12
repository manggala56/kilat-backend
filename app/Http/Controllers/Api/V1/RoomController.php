<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomSession;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * GET /api/v1/rooms
     * List semua room milik tenant.
     */
    public function index()
    {
        $tenant = app('tenant');

        $rooms = Room::where('tenant_id', $tenant->id)
            ->get()
            ->map(fn ($r) => [
                'id'          => $r->id,
                'name'        => $r->name,
                'type'        => $r->type,
                'hourly_rate' => (float) $r->hourly_rate,
                'status'      => $r->status,
            ]);

        return response()->json(['data' => $rooms]);
    }

    /**
     * POST /api/v1/rooms/{roomId}/sessions/start
     * Mulai sesi room — ubah status room jadi OCCUPIED.
     */
    public function startSession(Request $request, $roomId)
    {
        $tenant = app('tenant');

        $room = Room::where('tenant_id', $tenant->id)->findOrFail($roomId);

        if ($room->status === 'OCCUPIED') {
            return response()->json([
                'message' => 'Room sedang digunakan.',
            ], 422);
        }

        $session = RoomSession::create([
            'room_id'     => $room->id,
            'tenant_id'   => $tenant->id,
            'employee_id' => $request->user()?->id ?? null,
            'start_time'  => now(),
            'status'      => 'ACTIVE',
        ]);

        $room->update(['status' => 'OCCUPIED']);

        return response()->json([
            'data' => [
                'id'         => $session->id,
                'room_id'    => $session->room_id,
                'start_time' => $session->start_time->toISOString(),
                'end_time'   => null,
                'total_cost' => null,
                'status'     => 'ACTIVE',
            ],
            'message' => 'Room session started',
        ], 201);
    }

    /**
     * POST /api/v1/rooms/{roomId}/sessions/{sessionId}/stop
     * Stop sesi room — update end_time, total_cost, ubah status room jadi AVAILABLE.
     */
    public function stopSession(Request $request, $roomId, $sessionId)
    {
        $tenant = app('tenant');

        $room = Room::where('tenant_id', $tenant->id)->findOrFail($roomId);

        $session = RoomSession::where('room_id', $room->id)
            ->where('id', $sessionId)
            ->where('status', 'ACTIVE')
            ->firstOrFail();

        $request->validate([
            'total_cost' => 'required|numeric|min:0',
        ]);

        $session->update([
            'end_time'   => now(),
            'total_cost' => $request->total_cost,
            'status'     => 'COMPLETED',
        ]);

        $room->update(['status' => 'AVAILABLE']);

        return response()->json([
            'data' => [
                'id'         => $session->id,
                'room_id'    => $session->room_id,
                'start_time' => $session->start_time->toISOString(),
                'end_time'   => $session->end_time->toISOString(),
                'total_cost' => (float) $session->total_cost,
                'status'     => 'COMPLETED',
            ],
            'message' => 'Room session ended',
        ]);
    }

    /**
     * GET /api/v1/rooms/{roomId}/sessions/active
     * Ambil sesi aktif room (null jika tidak ada).
     */
    public function activeSession($roomId)
    {
        $tenant = app('tenant');

        $room = Room::where('tenant_id', $tenant->id)->findOrFail($roomId);

        $session = RoomSession::where('room_id', $room->id)
            ->where('status', 'ACTIVE')
            ->first();

        if (! $session) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'id'         => $session->id,
                'room_id'    => $session->room_id,
                'start_time' => $session->start_time->toISOString(),
                'end_time'   => null,
                'total_cost' => null,
                'status'     => 'ACTIVE',
            ],
        ]);
    }
}
