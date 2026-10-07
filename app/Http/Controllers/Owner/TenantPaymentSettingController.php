<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantPaymentConfig;
use App\Models\Transaction;
use App\Services\Payment\DokuPaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantPaymentSettingController extends Controller
{
    /**
     * Tampilkan halaman pengaturan komisi & SBA DOKU untuk tenant spesifik.
     */
    public function edit(Request $request, Tenant $tenant)
    {
        abort_unless($tenant->owner_id === $request->user()->id, 403);

        $config = TenantPaymentConfig::firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'fee_type'                        => 'fixed',
                'platform_fee_fixed'              => 0.00,
                'platform_fee_percent'            => 0.00,
                'fee_multiple_step'               => 0.00,
                'fee_multiple_amount'             => 0.00,
                'fee_tiers'                       => [
                    ['min_amount' => 0, 'max_amount' => 100000, 'fee_type' => 'fixed', 'fixed_amount' => 1000, 'percent' => 0],
                    ['min_amount' => 100001, 'max_amount' => 500000, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 1.0],
                    ['min_amount' => 500001, 'max_amount' => null, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 0.8],
                ],
                'doku_settlement_bank_account_id' => null,
                'is_split_active'                 => true,
            ]
        );

        return Inertia::render('Owner/Outlets/PaymentConfig', [
            'tenant'          => $tenant,
            'config'          => $config,
            'dokuEnvironment' => config('doku.environment', 'sandbox'),
            'mainSbaId'       => config('doku.main_sba_id', 'SBA-KILATZ-MAIN'),
            'status'          => session('status'),
        ]);
    }

    /**
     * Simpan pembaruan tarif fee & SBA ID untuk tenant.
     */
    public function update(Request $request, Tenant $tenant)
    {
        abort_unless($tenant->owner_id === $request->user()->id, 403);

        $validated = $request->validate([
            'doku_settlement_bank_account_id' => 'nullable|string|max:100',
            'fee_type'                        => 'required|in:fixed,percentage,hybrid,multiple,tiered',
            'platform_fee_fixed'              => 'nullable|numeric|min:0',
            'platform_fee_percent'            => 'nullable|numeric|min:0|max:100',
            'fee_multiple_step'               => 'nullable|numeric|min:0',
            'fee_multiple_amount'             => 'nullable|numeric|min:0',
            'fee_tiers'                       => 'nullable|array',
            'fee_tiers.*.min_amount'          => 'required_with:fee_tiers|numeric|min:0',
            'fee_tiers.*.max_amount'          => 'nullable|numeric',
            'fee_tiers.*.fee_type'            => 'required_with:fee_tiers|in:fixed,percentage,hybrid',
            'fee_tiers.*.fixed_amount'        => 'nullable|numeric|min:0',
            'fee_tiers.*.percent'             => 'nullable|numeric|min:0|max:100',
            'is_split_active'                 => 'required|boolean',
        ]);

        $config = TenantPaymentConfig::updateOrCreate(
            ['tenant_id' => $tenant->id],
            $validated
        );

        return back()->with('status', 'Skema tarif komisi pembayaran tenant berhasil disimpan.');
    }

    /**
     * Endpoint live tester / simulator perhitungan fee.
     */
    public function simulate(Request $request, DokuPaymentService $dokuService)
    {
        $validated = $request->validate([
            'test_amount'                     => 'required|numeric|min:1',
            'fee_type'                        => 'required|in:fixed,percentage,hybrid,multiple,tiered',
            'platform_fee_fixed'              => 'nullable|numeric|min:0',
            'platform_fee_percent'            => 'nullable|numeric|min:0|max:100',
            'fee_multiple_step'               => 'nullable|numeric|min:0',
            'fee_multiple_amount'             => 'nullable|numeric|min:0',
            'fee_tiers'                       => 'nullable|array',
            'doku_settlement_bank_account_id' => 'nullable|string',
            'is_split_active'                 => 'nullable|boolean',
        ]);

        $dummyConfig = new TenantPaymentConfig($validated);
        $dummyTrx = new Transaction([
            'subtotal'     => (float) $validated['test_amount'],
            'total_amount' => (float) $validated['test_amount'],
        ]);

        $split = $dokuService->calculateSplit($dummyTrx, $dummyConfig);
        $settlement = $dokuService->buildSettlementPayload($dummyTrx, $dummyConfig, $split);

        return response()->json([
            'success'          => true,
            'test_amount'      => (float) $validated['test_amount'],
            'split'            => $split,
            'settlement_rules' => $settlement,
        ]);
    }
}
