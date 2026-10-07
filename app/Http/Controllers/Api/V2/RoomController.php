<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomSession;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * GET /api/v2/rooms
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $rooms = Room::with('activeSession')
            ->where('tenant_id', $tenant->id)
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $rooms,
        ]);
    }

    /**
     * POST /api/v2/rooms/{roomId}/sessions/start
     */
    public function startSession(Request $request, $roomId)
    {
        $tenant = app('tenant');

        $room = Room::where('tenant_id', $tenant->id)->where('id', $roomId)->firstOrFail();

        $session = RoomSession::create([
            'room_id'       => $room->id,
            'customer_name' => $request->customer_name ?: 'Tamu',
            'started_at'    => now(),
            'status'        => 'active',
        ]);

        $room->update(['status' => 'occupied']);

        return response()->json([
            'status'  => 'success',
            'message' => 'Sesi ruangan dimulai.',
            'data'    => $session,
        ], 201);
    }

    /**
     * POST /api/v2/rooms/{roomId}/sessions/{sessionId}/stop
     */
    public function stopSession(Request $request, $roomId, $sessionId)
    {
        $tenant = app('tenant');

        $room = Room::where('tenant_id', $tenant->id)->where('id', $roomId)->firstOrFail();
        $session = RoomSession::where('room_id', $room->id)->where('id', $sessionId)->firstOrFail();

        $session->update([
            'ended_at' => now(),
            'status'   => 'completed',
        ]);

        $room->update(['status' => 'available']);

        return response()->json([
            'status'  => 'success',
            'message' => 'Sesi ruangan dihentikan.',
            'data'    => $session,
        ]);
    }
}
