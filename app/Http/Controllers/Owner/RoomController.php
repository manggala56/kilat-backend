<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);

        $rooms = Room::where('tenant_id', $tenant->id)
            ->withCount(['sessions as total_sessions'])
            ->with(['sessions' => fn ($q) => $q->where('status', 'ACTIVE')->latest()->limit(1)])
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Owner/Rooms/Index', [
            'rooms' => $rooms,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'type'        => 'required|string|in:REGULAR,VIP',
            'hourly_rate' => 'required|numeric|min:0',
            'status'      => 'sometimes|string|in:AVAILABLE,OCCUPIED,MAINTENANCE',
        ]);

        Room::create([
            'tenant_id'   => $tenant->id,
            'name'        => $validated['name'],
            'type'        => $validated['type'],
            'hourly_rate' => $validated['hourly_rate'],
            'status'      => $validated['status'] ?? 'AVAILABLE',
        ]);

        return back()->with('success', 'Room berhasil ditambahkan.');
    }

    public function update(Request $request, Room $room)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($room->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'type'        => 'sometimes|string|in:REGULAR,VIP',
            'hourly_rate' => 'sometimes|numeric|min:0',
            'status'      => 'sometimes|string|in:AVAILABLE,OCCUPIED,MAINTENANCE',
        ]);

        $room->update($validated);

        return back()->with('success', 'Room berhasil diperbarui.');
    }

    public function destroy(Request $request, Room $room)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($room->tenant_id === $tenant->id, 403);

        // Cegah hapus room yang sedang aktif
        if ($room->status === 'OCCUPIED') {
            return back()->withErrors(['error' => 'Room sedang digunakan, tidak bisa dihapus.']);
        }

        $room->delete();

        return back()->with('success', 'Room berhasil dihapus.');
    }

    /**
     * Riwayat sesi per room.
     */
    public function sessions(Request $request, Room $room)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($room->tenant_id === $tenant->id, 403);

        $sessions = RoomSession::where('room_id', $room->id)
            ->orderByDesc('start_time')
            ->paginate(20);

        return Inertia::render('Owner/Rooms/Sessions', [
            'room'     => $room,
            'sessions' => $sessions,
        ]);
    }
}
