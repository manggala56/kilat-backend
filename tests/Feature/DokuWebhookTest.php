<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Services\Payment\DokuSignatureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DokuWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected Product $product;
    protected Transaction $transaction;
    protected PaymentTransaction $paymentTx;

    protected function setUp(): void
    {
        parent::setUp();

        config(['doku.client_id' => 'TEST_CLIENT']);
        config(['doku.secret_key' => 'TEST_SECRET']);
        config(['doku.environment' => 'sandbox']);

        $user = User::create([
            'name' => 'Owner Test',
            'username' => 'owner_test_' . rand(1000, 9999),
            'email' => 'owner' . rand(1000, 9999) . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'owner',
        ]);

        $this->tenant = Tenant::create([
            'owner_id' => $user->id,
            'business_name' => 'Kopi Kilatz Testing',
            'store_id' => 'kopi-kilatz-test',
            'business_address' => 'Jakarta',
            'status' => 'active',
        ]);

        $category = Category::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Minuman',
            'type' => 'FOOD_BEV',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
            'name' => 'Es Kopi Kilatz',
            'price' => 15000,
            'stock' => 10,
            'is_active' => true,
            'is_available_online' => true,
        ]);

        $this->transaction = Transaction::create([
            'receipt_number' => 'ONL-TEST-001',
            'tenant_id' => $this->tenant->id,
            'subtotal' => 30000,
            'total_amount' => 30000,
            'payment_method' => 'qris',
            'status' => 'pending',
            'payment_status' => 'UNPAID',
            'customer_name' => 'Budi',
            'transacted_at' => now(),
        ]);

        TransactionItem::create([
            'transaction_id' => $this->transaction->id,
            'product_id' => $this->product->id,
            'product_name' => 'Es Kopi Kilatz',
            'quantity' => 2,
            'unit_price' => 15000,
            'subtotal' => 30000,
        ]);

        $this->paymentTx = PaymentTransaction::create([
            'tenant_id'           => $this->tenant->id,
            'transaction_id'      => $this->transaction->id,
            'invoice_number'      => 'KLTZ-POS-' . $this->tenant->id . '-' . $this->transaction->id . '-123456',
            'integration_type'    => 'DIRECT_QRIS',
            'payment_method'      => 'QRIS',
            'gross_amount'        => 30000,
            'platform_fee_amount' => 1000,
            'tenant_net_amount'   => 29000,
            'status'              => 'PENDING',
        ]);
    }

    public function test_successful_webhook_processing_and_stock_deduction()
    {
        $payload = [
            'order' => [
                'invoice_number' => $this->paymentTx->invoice_number,
                'amount' => 30000,
            ],
            'transaction' => [
                'status' => 'SUCCESS',
                'reference_id' => 'DOKU-REF-999',
            ],
            'payment' => [
                'channel' => 'QRIS',
            ],
        ];

        $rawBody = json_encode($payload);
        $clientId = config('doku.client_id');
        $requestId = 'req-test-1';
        $timestamp = gmdate("Y-m-d\TH:i:s\Z");
        $target = '/api/v1/payments/doku/notifications';

        $signature = DokuSignatureService::generateSignature(
            $clientId,
            $requestId,
            $timestamp,
            $target,
            $rawBody,
            config('doku.secret_key')
        );

        $response = $this->withHeaders([
            'Client-Id' => $clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
            'Content-Type' => 'application/json',
        ])->postJson('/api/v1/payments/doku/notifications', $payload);

        $response->assertStatus(200)
            ->assertJson(['status' => 'OK']);

        // Assert payment transaction marked PAID
        $this->paymentTx->refresh();
        $this->assertEquals('PAID', $this->paymentTx->status);
        $this->assertEquals('DOKU-REF-999', $this->paymentTx->gateway_reference);
        $this->assertNotNull($this->paymentTx->paid_at);

        // Assert transaction status updated
        $this->transaction->refresh();
        $this->assertEquals('PAID', $this->transaction->payment_status);
        $this->assertEquals(30000, $this->transaction->amount_paid);

        // Assert stock decremented by 2 (from 10 down to 8)
        $this->product->refresh();
        $this->assertEquals(8, $this->product->stock);
    }

    public function test_webhook_idempotency_with_database_lock()
    {
        // Set up as already PAID
        $this->paymentTx->update(['status' => 'PAID', 'paid_at' => now()]);
        $this->product->update(['stock' => 8]);

        $payload = [
            'order' => [
                'invoice_number' => $this->paymentTx->invoice_number,
                'amount' => 30000,
            ],
            'transaction' => [
                'status' => 'SUCCESS',
            ],
        ];

        $rawBody = json_encode($payload);
        $clientId = config('doku.client_id');
        $requestId = 'req-duplicate-2';
        $timestamp = gmdate("Y-m-d\TH:i:s\Z");
        $target = '/api/v1/payments/doku/notifications';

        $signature = DokuSignatureService::generateSignature(
            $clientId,
            $requestId,
            $timestamp,
            $target,
            $rawBody,
            config('doku.secret_key')
        );

        $response = $this->withHeaders([
            'Client-Id' => $clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
            'Content-Type' => 'application/json',
        ])->postJson('/api/v1/payments/doku/notifications', $payload);

        $response->assertStatus(200)
            ->assertJson(['status' => 'ALREADY_PROCESSED']);

        // Stock remains 8, not decremented again
        $this->product->refresh();
        $this->assertEquals(8, $this->product->stock);
    }

    public function test_expired_webhook_marks_transaction_expired()
    {
        $payload = [
            'order' => [
                'invoice_number' => $this->paymentTx->invoice_number,
                'amount' => 30000,
            ],
            'transaction' => [
                'status' => 'EXPIRED',
            ],
        ];

        $rawBody = json_encode($payload);
        $clientId = config('doku.client_id');
        $requestId = 'req-exp-3';
        $timestamp = gmdate("Y-m-d\TH:i:s\Z");
        $target = '/api/v1/payments/doku/notifications';

        $signature = DokuSignatureService::generateSignature(
            $clientId,
            $requestId,
            $timestamp,
            $target,
            $rawBody,
            config('doku.secret_key')
        );

        $response = $this->withHeaders([
            'Client-Id' => $clientId,
            'Request-Id' => $requestId,
            'Request-Timestamp' => $timestamp,
            'Signature' => $signature,
            'Content-Type' => 'application/json',
        ])->postJson('/api/v1/payments/doku/notifications', $payload);

        $response->assertStatus(200);

        $this->paymentTx->refresh();
        $this->assertEquals('EXPIRED', $this->paymentTx->status);

        $this->transaction->refresh();
        $this->assertEquals('EXPIRED', $this->transaction->payment_status);
        $this->assertEquals('voided', $this->transaction->status);
    }
}
