<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantPaymentConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentSettingController extends Controller
{
    /**
     * Tampilkan halaman pengaturan Payment Gateway DOKU untuk Tenant.
     */
    public function edit(Request $request)
    {
        $user = $request->user();
        $tenant = Tenant::where('owner_id', $user->id)->first();

        $config = null;
        if ($tenant) {
            $config = TenantPaymentConfig::firstOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'doku_settlement_bank_account_id' => null,
                    'platform_fee_percent'            => 0.00,
                    'platform_fee_fixed'              => 0.00,
                    'is_split_active'                 => true,
                ]
            );
        }

        return Inertia::render('settings/Payment', [
            'tenant'          => $tenant,
            'config'          => $config,
            'dokuEnvironment' => config('doku.environment', 'sandbox'),
            'mainSbaId'       => config('doku.main_sba_id', 'SBA-KILATZ-MAIN'),
            'status'          => session('status'),
        ]);
    }

    /**
     * Simpan pembaruan konfigurasi pembayaran DOKU.
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $tenant = Tenant::where('owner_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'doku_settlement_bank_account_id' => 'nullable|string|max:100',
            'platform_fee_percent'            => 'required|numeric|min:0|max:100',
            'platform_fee_fixed'              => 'required|numeric|min:0',
            'is_split_active'                 => 'required|boolean',
        ]);

        TenantPaymentConfig::updateOrCreate(
            ['tenant_id' => $tenant->id],
            $validated
        );

        return back()->with('status', 'Konfigurasi pembayaran DOKU berhasil disimpan.');
    }
}
