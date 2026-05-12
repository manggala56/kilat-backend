<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\SubscriptionPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OutletController extends Controller
{
    /**
     * Tampilkan semua outlet milik owner + info limit paket.
     */
    public function index(Request $request)
    {
        $user    = $request->user();
        $tenants = $user->tenants()->with('subscriptionPackage')->latest()->get();

        // Ambil limit dari paket aktif terbaru (ambil max_outlets tertinggi dari semua paket yang dimiliki)
        $maxOutlets = $tenants
            ->pluck('subscriptionPackage.max_outlets')
            ->filter()
            ->max() ?? 1; // default 1 jika tidak ada paket

        $packages = SubscriptionPackage::where('is_active', true)->orderBy('price')->get();

        return Inertia::render('Owner/Outlets/Index', [
            'tenants'    => $tenants,
            'maxOutlets' => $maxOutlets,
            'packages'   => $packages,
            'canAdd'     => $tenants->count() < $maxOutlets,
        ]);
    }

    /**
     * Buat outlet baru dengan cek limit paket.
     */
    public function store(Request $request)
    {
        $user    = $request->user();
        $tenants = $user->tenants()->with('subscriptionPackage')->get();

        // Hitung limit
        $maxOutlets = $tenants
            ->pluck('subscriptionPackage.max_outlets')
            ->filter()
            ->max() ?? 1;

        if ($tenants->count() >= $maxOutlets) {
            return back()->withErrors([
                'limit' => "Batas outlet tercapai. Paket Anda hanya mengizinkan {$maxOutlets} outlet. Upgrade paket untuk menambah lebih banyak.",
            ]);
        }

        $validated = $request->validate([
            'business_name'    => 'required|string|max:255',
            'store_id'         => 'required|string|max:50|unique:tenants,store_id|regex:/^[a-z0-9\-]+$/',
            'business_address' => 'nullable|string|max:500',
        ], [
            'store_id.regex'  => 'Store ID hanya boleh huruf kecil, angka, dan tanda hubung.',
            'store_id.unique' => 'Store ID sudah digunakan.',
        ]);

        $validated['owner_id'] = $user->id;
        $validated['status']   = 'active';

        // Salin subscription_package_id dari outlet pertama (jika ada)
        $firstTenant = $tenants->first();
        if ($firstTenant?->subscription_package_id) {
            $validated['subscription_package_id'] = $firstTenant->subscription_package_id;
        }

        Tenant::create($validated);

        return back()->with('success', 'Outlet baru berhasil ditambahkan!');
    }

    /**
     * Update nama & alamat outlet.
     */
    public function update(Request $request, Tenant $tenant)
    {
        abort_unless($tenant->owner_id === $request->user()->id, 403);

        $validated = $request->validate([
            'business_name'    => 'required|string|max:255',
            'business_address' => 'nullable|string|max:500',
        ]);

        $tenant->update($validated);

        return back()->with('success', 'Outlet berhasil diperbarui.');
    }

    /**
     * Nonaktifkan outlet (soft-suspend, bukan hapus).
     */
    public function destroy(Request $request, Tenant $tenant)
    {
        abort_unless($tenant->owner_id === $request->user()->id, 403);

        // Tidak bisa nonaktifkan outlet satu-satunya
        $totalActive = $request->user()->tenants()->where('status', 'active')->count();
        if ($totalActive <= 1) {
            return back()->withErrors(['error' => 'Anda tidak bisa menghapus outlet terakhir Anda.']);
        }

        $tenant->update(['status' => 'suspended']);

        return back()->with('success', 'Outlet berhasil dinonaktifkan.');
    }
}
