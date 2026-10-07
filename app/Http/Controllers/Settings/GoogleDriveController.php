<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\TenantGoogleDrive;
use App\Services\GoogleDriveStorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoogleDriveController extends Controller
{
    public function __construct(
        protected GoogleDriveStorageService $googleDriveService
    ) {}

    /**
     * Show Google Drive integration settings page
     */
    public function show(Request $request): Response
    {
        $tenant = $request->user()->tenant;
        $drive = $tenant ? TenantGoogleDrive::where('tenant_id', $tenant->id)->first() : null;

        return Inertia::render('settings/google-drive', [
            'drive' => $drive ? [
                'is_connected' => (bool) $drive->is_connected,
                'email' => $drive->email,
                'folder_id' => $drive->folder_id,
                'updated_at' => $drive->updated_at ? $drive->updated_at->toIso8601String() : null,
            ] : [
                'is_connected' => false,
                'email' => null,
                'folder_id' => null,
                'updated_at' => null,
            ],
            'status' => $request->session()->get('status'),
            'error' => $request->session()->get('error'),
        ]);
    }

    /**
     * Redirect to Google OAuth consent
     */
    public function redirect(Request $request): RedirectResponse
    {
        $tenant = $request->user()->tenant;
        if (!$tenant) {
            return back()->with('error', 'Akun Anda tidak memiliki bisnis/toko terdaftar.');
        }

        $authUrl = $this->googleDriveService->getAuthUrl($tenant->id);
        return redirect()->away($authUrl);
    }

    /**
     * Handle OAuth callback from Google
     */
    public function callback(Request $request): RedirectResponse
    {
        if ($request->has('error')) {
            return redirect()->route('settings.google-drive')->with('error', 'Otorisasi Google Drive dibatalkan atau gagal.');
        }

        $code = $request->get('code');
        if (!$code) {
            return redirect()->route('settings.google-drive')->with('error', 'Kode otorisasi tidak ditemukan.');
        }

        $state = json_decode($request->get('state', '{}'), true);
        $tenantId = $state['tenant_id'] ?? ($request->user()?->tenant?->id);

        if (!$tenantId) {
            return redirect()->route('settings.google-drive')->with('error', 'Data Merchant tidak valid.');
        }

        $tokens = $this->googleDriveService->handleCallback($code);
        if (!$tokens || empty($tokens['access_token'])) {
            return redirect()->route('settings.google-drive')->with('error', 'Gagal menukarkan token dengan Google.');
        }

        $drive = TenantGoogleDrive::updateOrCreate(
            ['tenant_id' => $tenantId],
            [
                'is_connected' => true,
                'email' => $tokens['email'] ?? null,
                'access_token' => $tokens['access_token'],
                'refresh_token' => $tokens['refresh_token'] ?? null,
                'token_expires_at' => $tokens['expires_at'],
            ]
        );

        // Ensure product folder exists in drive
        $this->googleDriveService->ensureProductFolder($drive);

        return redirect()->route('settings.google-drive')->with('status', 'Google Drive berhasil terhubung! Foto produk otomatis tersimpan di Google Drive Anda.');
    }

    /**
     * Disconnect Google Drive
     */
    public function disconnect(Request $request): RedirectResponse
    {
        $tenant = $request->user()->tenant;
        if ($tenant) {
            TenantGoogleDrive::where('tenant_id', $tenant->id)->update([
                'is_connected' => false,
                'access_token' => null,
                'refresh_token' => null,
            ]);
        }

        return redirect()->route('settings.google-drive')->with('status', 'Koneksi Google Drive telah diputus. Foto baru akan disimpan di storage lokal.');
    }
}
