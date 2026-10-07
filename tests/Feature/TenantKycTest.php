<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantKyc;
use App\Models\TenantPaymentConfig;
use App\Models\Transaction;
use App\Models\User;
use App\Support\BankList;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantKycTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['doku.client_id' => 'MOCK_CLIENT_ID']);
        config(['doku.secret_key' => 'MOCK_SECRET_KEY']);
        config(['doku.base_url' => 'https://api-sandbox.doku.com']);
        Storage::fake('public');
    }

    public function test_bank_list_returns_valid_banks()
    {
        $banks = BankList::all();
        $this->assertArrayHasKey('BCA', $banks);
        $this->assertArrayHasKey('MANDIRI', $banks);
        $this->assertArrayHasKey('BRI', $banks);
        $this->assertContains('BCA', BankList::keys());
        $this->assertEquals('Bank Central Asia (BCA)', BankList::label('BCA'));
    }

    public function test_pos_pay_qris_blocked_when_kyc_unsubmitted()
    {
        $owner = User::create([
            'name'     => 'Owner User',
            'username' => 'owner_' . rand(1000, 9999),
            'email'    => 'owner' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'owner',
        ]);

        $tenant = Tenant::create([
            'owner_id'      => $owner->id,
            'business_name' => 'Kopi Mantap',
            'store_id'      => 'kopi-mantap-1234',
        ]);

        $transaction = Transaction::create([
            'tenant_id'      => $tenant->id,
            'receipt_number' => 'REC-001',
            'subtotal'       => 50000,
            'total_amount'   => 50000,
            'payment_status' => 'UNPAID',
            'status'         => 'pending',
            'transacted_at'  => now(),
        ]);

        Sanctum::actingAs($owner);

        $response = $this->withHeaders([
            'X-Tenant-Id' => $tenant->store_id,
        ])->postJson("/api/v1/pos/orders/{$transaction->id}/pay-qris");

        $response->assertStatus(403)
            ->assertJson([
                'success'    => false,
                'kyc_status' => 'unsubmitted',
            ]);
    }

    public function test_pos_pay_qris_blocked_when_kyc_pending_or_rejected()
    {
        $owner = User::create([
            'name'     => 'Owner User',
            'username' => 'owner_' . rand(1000, 9999),
            'email'    => 'owner' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'owner',
        ]);

        $tenant = Tenant::create([
            'owner_id'      => $owner->id,
            'business_name' => 'Kedai Kopi',
            'store_id'      => 'kedai-kopi-5678',
        ]);

        $kyc = TenantKyc::create([
            'tenant_id'                => $tenant->id,
            'id_card_number'           => '3171012345678901',
            'id_card_name'             => 'Ahmad',
            'id_card_photo_path'       => 'kyc/ktp/ktp.jpg',
            'bank_name'                => 'BCA',
            'bank_account_number'      => '123456789',
            'bank_account_holder_name' => 'Ahmad',
            'business_photo_path'      => 'kyc/business/outlet.jpg',
            'status'                   => 'pending',
        ]);

        $transaction = Transaction::create([
            'tenant_id'      => $tenant->id,
            'receipt_number' => 'REC-002',
            'subtotal'       => 75000,
            'total_amount'   => 75000,
            'payment_status' => 'UNPAID',
            'status'         => 'pending',
            'transacted_at'  => now(),
        ]);

        Sanctum::actingAs($owner);

        // Test pending
        $resPending = $this->withHeaders([
            'X-Tenant-Id' => $tenant->store_id,
        ])->postJson("/api/v1/pos/orders/{$transaction->id}/pay-qris");

        $resPending->assertStatus(403)
            ->assertJson(['kyc_status' => 'pending']);

        // Test rejected
        $kyc->update([
            'status'           => 'rejected',
            'rejection_reason' => 'Foto KTP buram.',
        ]);

        $resRejected = $this->withHeaders([
            'X-Tenant-Id' => $tenant->store_id,
        ])->postJson("/api/v1/pos/orders/{$transaction->id}/pay-qris");

        $resRejected->assertStatus(403)
            ->assertJson([
                'kyc_status'       => 'rejected',
                'rejection_reason' => 'Foto KTP buram.',
            ]);
    }

    public function test_pos_pay_qris_allowed_when_kyc_approved()
    {
        $owner = User::create([
            'name'     => 'Owner User',
            'username' => 'owner_' . rand(1000, 9999),
            'email'    => 'owner' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'owner',
        ]);

        $tenant = Tenant::create([
            'owner_id'      => $owner->id,
            'business_name' => 'Resto Sukses',
            'store_id'      => 'resto-sukses-9999',
        ]);

        TenantPaymentConfig::create([
            'tenant_id'                       => $tenant->id,
            'doku_settlement_bank_account_id' => 'SBA-RESTO-999',
            'platform_fee_fixed'              => 1000,
            'is_split_active'                 => true,
        ]);

        TenantKyc::create([
            'tenant_id'                => $tenant->id,
            'id_card_number'           => '3171012345678901',
            'id_card_name'             => 'Budi',
            'id_card_photo_path'       => 'kyc/ktp/ktp.jpg',
            'bank_name'                => 'MANDIRI',
            'bank_account_number'      => '987654321',
            'bank_account_holder_name' => 'Budi',
            'business_photo_path'      => 'kyc/business/outlet.jpg',
            'status'                   => 'approved',
            'verified_at'              => now(),
        ]);

        $transaction = Transaction::create([
            'tenant_id'      => $tenant->id,
            'receipt_number' => 'REC-003',
            'subtotal'       => 100000,
            'total_amount'   => 100000,
            'payment_status' => 'UNPAID',
            'status'         => 'pending',
            'transacted_at'  => now(),
        ]);

        Sanctum::actingAs($owner);

        $response = $this->withHeaders([
            'X-Tenant-Id' => $tenant->store_id,
        ])->postJson("/api/v1/pos/orders/{$transaction->id}/pay-qris");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'transaction_id'   => $transaction->id,
                    'integration_type' => 'DIRECT_QRIS',
                    'gross_amount'     => 100000,
                ]
            ]);
    }

    public function test_pos_kyc_status_and_submission_endpoints()
    {
        $owner = User::create([
            'name'     => 'Owner User',
            'username' => 'owner_' . rand(1000, 9999),
            'email'    => 'owner' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'owner',
        ]);

        $tenant = Tenant::create([
            'owner_id'      => $owner->id,
            'business_name' => 'Kedai Baru',
            'store_id'      => 'kedai-baru-0001',
        ]);

        Sanctum::actingAs($owner);

        // 1. Get initial status
        $statusRes = $this->withHeaders([
            'X-Tenant-Id' => $tenant->store_id,
        ])->getJson('/api/v1/pos/tenant/kyc-status');

        $statusRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'is_qris_enabled' => false,
                    'kyc_status'      => 'unsubmitted',
                ]
            ]);

        // 2. Submit KYC
        $ktpFile = UploadedFile::fake()->image('ktp.jpg');
        $businessFile = UploadedFile::fake()->image('business.jpg');

        $submitRes = $this->withHeaders([
            'X-Tenant-Id' => $tenant->store_id,
        ])->postJson('/api/v1/pos/tenant/kyc-submit', [
            'id_card_number'           => '3201012345678901',
            'id_card_name'             => 'Cahyo',
            'id_card_photo'            => $ktpFile,
            'bank_name'                => 'BRI',
            'bank_account_number'      => '1122334455',
            'bank_account_holder_name' => 'Cahyo',
            'business_photo'           => $businessFile,
            'business_type'            => 'Cafe F&B',
        ]);

        $submitRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status'          => 'pending',
                    'is_qris_enabled' => false,
                ]
            ]);

        $this->assertDatabaseHas('tenant_kycs', [
            'tenant_id'      => $tenant->id,
            'id_card_number' => '3201012345678901',
            'status'         => 'pending',
        ]);
    }
}
