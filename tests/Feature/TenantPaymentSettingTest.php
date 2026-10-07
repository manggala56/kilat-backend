<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantPaymentConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantPaymentSettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::create([
            'name'     => 'Super Owner',
            'username' => 'super_owner_' . rand(1000, 9999),
            'email'    => 'superowner' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role'     => 'owner',
        ]);

        $this->tenant = Tenant::create([
            'owner_id'         => $this->owner->id,
            'business_name'    => 'Kopi Kilatz Flagship',
            'store_id'         => 'kopi-kilatz-flagship',
            'business_address' => 'Jakarta',
            'status'           => 'active',
        ]);
    }

    public function test_owner_can_update_tiered_fee_configuration()
    {
        $payload = [
            'doku_settlement_bank_account_id' => 'SBA-KILATZ-FLAGSHIP',
            'fee_type'                        => 'tiered',
            'platform_fee_fixed'              => 0,
            'platform_fee_percent'            => 0,
            'fee_tiers'                       => [
                ['min_amount' => 0, 'max_amount' => 100000, 'fee_type' => 'fixed', 'fixed_amount' => 1000, 'percent' => 0],
                ['min_amount' => 100001, 'max_amount' => 500000, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 1.0],
                ['min_amount' => 500001, 'max_amount' => null, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 0.8],
            ],
            'is_split_active'                 => true,
        ];

        $response = $this->actingAs($this->owner)
            ->put(route('owner.outlets.payment-config.update', $this->tenant->id), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('status');

        $config = TenantPaymentConfig::where('tenant_id', $this->tenant->id)->first();
        $this->assertNotNull($config);
        $this->assertEquals('tiered', $config->fee_type);
        $this->assertEquals('SBA-KILATZ-FLAGSHIP', $config->doku_settlement_bank_account_id);
        $this->assertCount(3, $config->fee_tiers);
    }

    public function test_fee_simulator_endpoint()
    {
        $payload = [
            'test_amount'                     => 250000,
            'fee_type'                        => 'tiered',
            'doku_settlement_bank_account_id' => 'SBA-SIMULATE-01',
            'is_split_active'                 => true,
            'fee_tiers'                       => [
                ['min_amount' => 0, 'max_amount' => 100000, 'fee_type' => 'fixed', 'fixed_amount' => 1000, 'percent' => 0],
                ['min_amount' => 100001, 'max_amount' => 500000, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 1.0],
                ['min_amount' => 500001, 'max_amount' => null, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 0.8],
            ],
        ];

        $response = $this->actingAs($this->owner)
            ->postJson(route('owner.payment-config.simulate'), $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success'     => true,
                'test_amount' => 250000,
                'split'       => [
                    'gross_amount'        => 250000,
                    'platform_fee_amount' => 2500, // 1% of 250000
                    'tenant_net_amount'   => 247500,
                ]
            ]);
    }
}
