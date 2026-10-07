<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantKyc;
use App\Support\BankList;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantKycController extends Controller
{
    /**
     * Show KYC verification status & submission form for Owner.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $tenantId = $request->get('tenant_id') ?? $user->tenant_id;
        $tenant = Tenant::where('owner_id', $user->id)
            ->when($tenantId, fn ($q) => $q->where('id', $tenantId))
            ->first() ?? Tenant::where('owner_id', $user->id)->first();

        if (!$tenant) {
            return redirect()->route('owner.outlets.index')->with('error', 'Outlet belum dibuat.');
        }

        $kyc = TenantKyc::where('tenant_id', $tenant->id)->first();

        return Inertia::render('Owner/KYC/Index', [
            'tenant'   => $tenant,
            'kyc'      => $kyc ? [
                'id'                       => $kyc->id,
                'id_card_number'           => $kyc->id_card_number,
                'id_card_name'             => $kyc->id_card_name,
                'id_card_photo_url'        => $kyc->id_card_photo_url,
                'bank_name'                => $kyc->bank_name,
                'bank_label'               => $kyc->bank_label,
                'bank_account_number'      => $kyc->bank_account_number,
                'bank_account_holder_name' => $kyc->bank_account_holder_name,
                'business_photo_url'       => $kyc->business_photo_url,
                'business_type'            => $kyc->business_type,
                'status'                   => $kyc->status,
                'is_approved'              => $kyc->is_approved,
                'rejection_reason'         => $kyc->rejection_reason,
                'verified_at'              => $kyc->verified_at?->format('d M Y H:i'),
            ] : null,
            'bankList' => BankList::all(),
        ]);
    }

    /**
     * Submit or re-submit KYC documents.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $tenantId = $request->input('tenant_id') ?? $user->tenant_id;
        $tenant = Tenant::where('owner_id', $user->id)
            ->where('id', $tenantId)
            ->firstOrFail();

        $existingKyc = TenantKyc::where('tenant_id', $tenant->id)->first();

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

        TenantKyc::updateOrCreate(
            ['tenant_id' => $tenant->id],
            $data
        );

        return redirect()->back()->with('success', 'Dokumen KYC berhasil dikirim. Menunggu verifikasi admin.');
    }
}
