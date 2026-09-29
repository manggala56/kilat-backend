<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiV2Test extends TestCase
{
    use RefreshDatabase;

    public function test_device_activation_and_v2_flow()
    {
        // 1. Create Owner User
        $owner = User::create([
            'name'     => 'Owner Toko',
            'email'    => 'owner@kilatz.id',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);

        // 2. Create Tenant
        $tenant = Tenant::create([
            'owner_id'      => $owner->id,
            'business_name' => 'Kopi Kilatz',
            'store_id'      => 'kopi-kilatz-01',
            'status'        => 'active',
        ]);

        // 3. Create Cashier Employee
        $cashier = Employee::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $tenant->id,
            'name'      => 'Budi Kasir',
            'username'  => 'budi',
            'pin_code'  => Hash::make('1234'),
            'role'      => 'CASHIER',
            'is_active' => true,
        ]);

        // 4. Test Device Activation (POST /api/v2/device/activate)
        $activateResponse = $this->postJson('/api/v2/device/activate', [
            'email'        => 'owner@kilatz.id',
            'password'     => 'password123',
            'outlet_id'    => $tenant->id,
            'device_id'    => 'hardware-pos-uuid-12345',
            'device_name'  => 'Kasir Utama',
            'device_model' => 'Samsung Tab A9',
        ]);

        $activateResponse->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'access_token',
                'device' => ['id', 'device_id', 'device_name'],
                'tenant' => ['id', 'store_id', 'business_name'],
                'employees' => [
                    '*' => ['id', 'name', 'username', 'role', 'is_active']
                ]
            ]);

        $deviceToken = $activateResponse->json('access_token');
        $this->assertNotEmpty($deviceToken);

        // 5. Test Accessing Staff List with Device Token (GET /api/v2/device/staff)
        $staffResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $deviceToken,
            'X-Tenant-ID'   => $tenant->id,
        ])->getJson('/api/v2/device/staff');

        $staffResponse->assertStatus(200)
            ->assertJsonFragment(['username' => 'budi']);

        // 6. Test Sync Cashier Session (POST /api/v2/cashier-sessions)
        $sessionResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $deviceToken,
            'X-Tenant-ID'   => $tenant->id,
        ])->postJson('/api/v2/cashier-sessions', [
            'cashier_id'           => $cashier->id,
            'clock_in_time'        => now()->subHours(4)->toIso8601String(),
            'clock_out_time'       => now()->toIso8601String(),
            'starting_cash'        => 200000,
            'system_recorded_cash' => 500000,
            'actual_cash_input'    => 500000,
            'discrepancy'          => 0,
            'total_transactions'   => 5,
            'notes'                => 'Tutup kasir normal',
            'local_id'             => 1,
        ]);

        $sessionResponse->assertStatus(201)
            ->assertJson([
                'status'  => 'success',
                'data'    => ['local_id' => 1]
            ]);

        // 7. Test Transaction Checkout (POST /api/v2/transactions)
        $txResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $deviceToken,
            'X-Tenant-ID'   => $tenant->id,
        ])->postJson('/api/v2/transactions', [
            'invoice_number' => 'INV-TEST-001',
            'total_amount'   => 50000,
            'payment_method' => 'CASH',
            'cashier_id'     => $cashier->id,
            'items'          => [
                [
                    'product_name' => 'Kopi Latte',
                    'quantity'     => 2,
                    'unit_price'   => 25000,
                    'subtotal'     => 50000,
                ]
            ]
        ]);

        $txResponse->assertStatus(201)
            ->assertJson(['status' => 'success']);
    }
}
