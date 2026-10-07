<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\TenantPaymentConfig;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PosPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $user;
    protected Transaction $transaction;

    protected function setUp(): void
    {
        parent::setUp();

        config(['doku.client_id' => 'TEST_CLIENT']);
        config(['doku.secret_key' => 'TEST_SECRET']);
        config(['doku.environment' => 'sandbox']);

        $this->user = User::create([
            'name'     => 'Kasir Outlet',
            'username' => 'kasir_outlet_' . rand(1000, 9999),
            'email'    => 'kasir' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'cashier',
        ]);

        $this->tenant = Tenant::create([
            'owner_id'         => $this->user->id,
            'business_name'    => 'Kopi Kilatz POS Test',
            'store_id'         => 'kopi-kilatz-pos',
            'business_address' => 'Jakarta Selatan',
            'status'           => 'active',
        ]);

        TenantPaymentConfig::create([
            'tenant_id'                       => $this->tenant->id,
            'doku_settlement_bank_account_id' => 'SBA-OUTLET-POS',
            'platform_fee_fixed'              => 1000,
            'platform_fee_percent'            => 2.0,
            'is_split_active'                 => true,
        ]);

        \App\Models\TenantKyc::create([
            'tenant_id'                => $this->tenant->id,
            'id_card_number'           => '3171012345678901',
            'id_card_name'             => 'Owner Pos Test',
            'id_card_photo_path'       => 'kyc/ktp/ktp.jpg',
            'bank_name'                => 'BCA',
            'bank_account_number'      => '1234567890',
            'bank_account_holder_name' => 'Owner Pos Test',
            'business_photo_path'      => 'kyc/business/outlet.jpg',
            'status'                   => 'approved',
            'verified_at'              => now(),
        ]);

        $this->transaction = Transaction::create([
            'receipt_number' => 'POS-TRX-001',
            'tenant_id'      => $this->tenant->id,
            'subtotal'       => 50000,
            'total_amount'   => 50000,
            'payment_method' => 'cash',
            'status'         => 'pending',
            'payment_status' => 'UNPAID',
            'customer_name'  => 'Pelanggan Meja 5',
            'transacted_at'  => now(),
        ]);
    }

    public function test_pos_generate_direct_qris_successful()
    {
        Sanctum::actingAs($this->user);

        $response = $this->withHeaders([
            'X-Tenant-Id' => $this->tenant->store_id,
        ])->postJson("/api/v1/pos/orders/{$this->transaction->id}/pay-qris");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'transaction_id'   => $this->transaction->id,
                    'receipt_number'   => 'POS-TRX-001',
                    'integration_type' => 'DIRECT_QRIS',
                    'gross_amount'     => 50000,
                    'status'           => 'PENDING',
                ]
            ]);

        $this->assertNotEmpty($response->json('data.qris_string'));
        $this->assertNotEmpty($response->json('data.escpos_data.qr_data'));
    }

    public function test_pos_generate_qris_fails_if_already_paid()
    {
        Sanctum::actingAs($this->user);
        $this->transaction->update(['payment_status' => 'PAID']);

        $response = $this->withHeaders([
            'X-Tenant-Id' => $this->tenant->store_id,
        ])->postJson("/api/v1/pos/orders/{$this->transaction->id}/pay-qris");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Pesanan ini sudah lunas.',
            ]);
    }
}
