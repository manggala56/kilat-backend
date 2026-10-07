<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantKyc;
use App\Support\BankList;
use Illuminate\Http\Request;

class PosKycController extends Controller
{
    /**
     * GET /api/v1/pos/tenant/kyc-status
     * Returns KYC verification status and whether QRIS is active.
     */
    public function status(Request $request)
    {
        $tenant = $request->get('tenant');
        $tenantId = $tenant ? $tenant->id : $request->user()?->tenant_id;

        $tenantModel = Tenant::with('kyc')->find($tenantId);

        if (!$tenantModel) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak ditemukan.',
            ], 404);
        }

        $kyc = $tenantModel->kyc;

        return response()->json([
            'success' => true,
            'data'    => [
                'tenant_id'        => $tenantModel->id,
                'business_name'    => $tenantModel->business_name,
                'is_qris_enabled'  => (bool) $tenantModel->is_qris_approved,
                'kyc_status'       => $kyc?->status ?? 'unsubmitted',
                'rejection_reason' => $kyc?->rejection_reason,
                'details'          => $kyc ? [
                    'id_card_number'           => $kyc->id_card_number,
                    'id_card_name'             => $kyc->id_card_name,
                    'bank_name'                => $kyc->bank_name,
                    'bank_label'               => $kyc->bank_label,
                    'bank_account_number'      => $kyc->bank_account_number,
                    'bank_account_holder_name' => $kyc->bank_account_holder_name,
                    'verified_at'              => $kyc->verified_at?->toIso8601String(),
                ] : null,
                'available_banks'  => BankList::all(),
            ]
        ], 200);
    }

    /**
     * POST /api/v1/pos/tenant/kyc-submit
     * Submit KYC documents directly from POS device.
     */
    public function submit(Request $request)
    {
        $tenant = $request->get('tenant');
        $tenantId = $tenant ? $tenant->id : $request->user()?->tenant_id;

        $tenantModel = Tenant::find($tenantId);
        if (!$tenantModel) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak ditemukan.',
            ], 404);
        }

        $existingKyc = TenantKyc::where('tenant_id', $tenantModel->id)->first();

        $validated = $request->validate([
            'id_card_number'           => 'required|digits:16',
            'id_card_name'             => 'required|string|max:150',
            'id_card_photo'            => $existingKyc ? 'nullable|image|max:5120' : 'required|image|max:5120',
            'bank_name'                => 'required|string',
            'bank_account_number'      => 'required|string|max:50',
            'bank_account_holder_name' => 'required|string|max:150',
            'business_photo'           => $existingKyc ? 'nullable|image|max:5120' : 'required|image|max:5120',
            'business_type'            => 'nullable|string|max:100',
        ]);

        $data = [
            'id_card_number'           => $validated['id_card_number'],
            'id_card_name'             => $validated['id_card_name'],
            'bank_name'                => $validated['bank_name'],
            'bank_account_number'      => $validated['bank_account_number'],
            'bank_account_holder_name' => $validated['bank_account_holder_name'],
            'business_type'            => $validated['business_type'] ?? null,
            'status'                   => 'pending',
            'rejection_reason'         => null,
        ];

        if ($request->hasFile('id_card_photo')) {
            $data['id_card_photo_path'] = $request->file('id_card_photo')->store('kyc/ktp', 'public');
        }

        if ($request->hasFile('business_photo')) {
            $data['business_photo_path'] = $request->file('business_photo')->store('kyc/business', 'public');
        }

        $kyc = TenantKyc::updateOrCreate(
            ['tenant_id' => $tenantModel->id],
            $data
        );

        return response()->json([
            'success' => true,
            'message' => 'Dokumen KYC berhasil diajukan. Menunggu verifikasi admin.',
            'data'    => [
                'status'          => $kyc->status,
                'is_qris_enabled' => false,
            ]
        ], 200);
    }
}
