<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Employee;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiV1Test extends TestCase
{
    use RefreshDatabase;

    protected $owner;
    protected $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Owner & Tenant
        $this->owner = User::create([
            'name'     => 'Owner Toko',
            'email'    => 'owner@kilatz.id',
            'password' => Hash::make('password123'),
            'role'     => 'owner',
        ]);

        $this->tenant = Tenant::create([
            'owner_id'      => $this->owner->id,
            'business_name' => 'Kopi Kilatz v1',
            'store_id'      => 'kopi-kilatz-v1',
            'status'        => 'active',
        ]);
    }

    public function test_v1_ping()
    {
        $response = $this->getJson('/api/v1/ping');
        $response->assertStatus(200)
            ->assertJson([
                'status'  => 'ok',
                'message' => 'API is running',
            ]);
    }

    public function test_v1_employee_registration_and_login()
    {
        // 1. Register Employee via V1
        $registerRes = $this->postJson('/api/v1/register', [
            'outlet_id'    => $this->tenant->id,
            'name'         => 'Siti Kasir',
            'username'     => 'siti_kasir',
            'pin_code'     => '1234',
            'role'         => 'CASHIER',
            'device_id'    => 'pos-device-01',
            'device_model' => 'Tablet',
            'device_os'    => 'Android',
        ]);

        $registerRes->assertStatus(201)
            ->assertJson([
                'message' => 'Akun berhasil dibuat. Silakan login.',
            ]);

        // 2. Login Employee via V1
        $loginRes = $this->postJson('/api/v1/login', [
            'login_type'   => 'employee',
            'username'     => 'siti_kasir',
            'pin_code'     => '1234',
            'outlet_id'    => $this->tenant->id,
            'device_id'    => 'pos-device-01',
        ]);

        $loginRes->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'employee' => ['id', 'name', 'tenant_id', 'outlet_id'],
                'tenant_id',
                'outlet_id',
                'role',
            ]);

        $token = $loginRes->json('access_token');
        $this->assertNotEmpty($token);

        // 3. Test Protected V1 Endpoint (Products)
        $headers = [
            'Authorization' => 'Bearer ' . $token,
            'X-Tenant-ID'   => $this->tenant->id,
        ];

        // Create Product via V1
        $createProdRes = $this->withHeaders($headers)->postJson('/api/v1/products', [
            'name'     => 'Es Kopi Susu',
            'price'    => 18000,
            'stock'    => 100,
            'category' => 'Minuman',
        ]);
        $createProdRes->assertStatus(201);

        // Get Products via V1
        $getProdRes = $this->withHeaders($headers)->getJson('/api/v1/products');
        $getProdRes->assertStatus(200)
            ->assertJsonFragment(['name' => 'Es Kopi Susu']);

        // 4. Test Transaction via V1
        $txRes = $this->withHeaders($headers)->postJson('/api/v1/transactions', [
            'invoice_number' => 'INV-V1-0001',
            'total_amount'   => 36000,
            'payment_method' => 'CASH',
            'items'          => [
                [
                    'product_name' => 'Es Kopi Susu',
                    'quantity'     => 2,
                    'unit_price'   => 18000,
                    'subtotal'     => 36000,
                ]
            ]
        ]);
        // 5. Test Cashier Session & Drawer Logs
        $employeeId = $loginRes->json('employee.id');
        $sessionRes = $this->withHeaders($headers)->postJson('/api/v1/cashier-sessions', [
            'cashier_id'           => $employeeId,
            'clock_in_time'        => now()->toIso8601String(),
            'starting_cash'        => 100000,
            'system_recorded_cash' => 136000,
            'actual_cash_input'    => 136000,
            'discrepancy'          => 0,
            'total_transactions'   => 1,
            'notes'                => 'Shift selesai',
            'local_id'             => 101,
        ]);
        $sessionRes->assertStatus(201);

        $drawerRes = $this->withHeaders($headers)->postJson('/api/v1/cash-drawer-logs', [
            'employee_id' => $employeeId,
            'reason'      => 'Tukar Uang Pecahan',
            'opened_at'   => now()->toIso8601String(),
        ]);
        $drawerRes->assertStatus(201);

        // 6. Test Online Order Flow (Confirm & Complete)
        $onlineOrder = \App\Models\Transaction::create([
            'tenant_id'      => $this->tenant->id,
            'receipt_number' => 'ONL-9999',
            'status'         => 'pending',
            'subtotal'       => 50000,
            'total_amount'   => 50000,
            'payment_method' => 'qris',
            'customer_name'  => 'Budi Online',
            'table_number'   => 'Meja 5',
        ]);

        $confirmRes = $this->withHeaders($headers)->postJson("/api/v1/online-orders/{$onlineOrder->id}/confirm");
        $confirmRes->assertStatus(200);

        $completeRes = $this->withHeaders($headers)->postJson("/api/v1/online-orders/{$onlineOrder->id}/complete");
        $completeRes->assertStatus(200);

        // 7. Test Attendance Clock-in & Clock-out via V1
        $clockInRes = $this->withHeaders($headers)->postJson('/api/v1/attendance/clock-in', [
            'starting_cash' => 100000,
            'clock_in_time' => now()->toIso8601String(),
        ]);
        $clockInRes->assertStatus(200);

        $clockOutRes = $this->withHeaders($headers)->postJson('/api/v1/attendance/clock-out', [
            'clock_out_time'       => now()->addHours(8)->toIso8601String(),
            'system_recorded_cash' => 136000,
            'actual_cash_input'    => 136000,
            'discrepancy'          => 0,
            'total_transactions'   => 1,
            'notes'                => 'Selesai shift v1',
        ]);
        $clockOutRes->assertStatus(200);

        // 8. Test Logout via V1
        $logoutRes = $this->withHeaders($headers)->postJson('/api/v1/logout');
        $logoutRes->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully',
            ]);
    }
}
