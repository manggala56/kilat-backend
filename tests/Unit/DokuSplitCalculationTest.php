<?php

namespace Tests\Unit;

use App\Models\TenantPaymentConfig;
use App\Models\Transaction;
use App\Services\Payment\DokuPaymentService;
use Tests\TestCase;

class DokuSplitCalculationTest extends TestCase
{
    /**
     * Test User Specific Tiered Case:
     * - <= 100k -> Rp 1.000 flat
     * - > 100k s/d 500k -> 1%
     * - > 500k -> 0.8%
     */
    public function test_user_tiered_fee_calculation()
    {
        $service = new DokuPaymentService();

        $config = new TenantPaymentConfig([
            'fee_type'  => 'tiered',
            'fee_tiers' => [
                ['min_amount' => 0, 'max_amount' => 100000, 'fee_type' => 'fixed', 'fixed_amount' => 1000, 'percent' => 0],
                ['min_amount' => 100001, 'max_amount' => 500000, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 1.0],
                ['min_amount' => 500001, 'max_amount' => null, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 0.8],
            ],
            'is_split_active'                 => true,
            'doku_settlement_bank_account_id' => 'SBA-OUTLET-01',
        ]);

        // Case 1: Transaksi Rp 60.000 (<= 100k) -> Fee Rp 1.000, Net Rp 59.000
        $trx1 = new Transaction(['subtotal' => 60000, 'total_amount' => 60000]);
        $split1 = $service->calculateSplit($trx1, $config);
        $this->assertEquals(60000, $split1['gross_amount']);
        $this->assertEquals(1000, $split1['platform_fee_amount']);
        $this->assertEquals(59000, $split1['tenant_net_amount']);

        // Case 2: Transaksi Rp 200.000 (100k-500k) -> 1% = Rp 2.000, Net Rp 198.000
        $trx2 = new Transaction(['subtotal' => 20000, 'total_amount' => 200000]);
        $split2 = $service->calculateSplit($trx2, $config);
        $this->assertEquals(200000, $split2['gross_amount']);
        // If subtotal is 200000: 1% of 200000 = 2000
        $trx2_real = new Transaction(['subtotal' => 200000, 'total_amount' => 200000]);
        $split2_real = $service->calculateSplit($trx2_real, $config);
        $this->assertEquals(2000, $split2_real['platform_fee_amount']);
        $this->assertEquals(198000, $split2_real['tenant_net_amount']);

        // Case 3: Transaksi Rp 1.000.000 (> 500k) -> 0.8% = Rp 8.000, Net Rp 992.000
        $trx3 = new Transaction(['subtotal' => 1000000, 'total_amount' => 1000000]);
        $split3 = $service->calculateSplit($trx3, $config);
        $this->assertEquals(1000000, $split3['gross_amount']);
        $this->assertEquals(8000, $split3['platform_fee_amount']);
        $this->assertEquals(992000, $split3['tenant_net_amount']);
    }

    public function test_multiple_step_fee_calculation()
    {
        $service = new DokuPaymentService();

        // Biaya Rp 500 per kelipatan Rp 50.000 + Rp 1.000 flat
        $config = new TenantPaymentConfig([
            'fee_type'             => 'multiple',
            'fee_multiple_step'    => 50000,
            'fee_multiple_amount'  => 500,
            'platform_fee_fixed'   => 1000,
            'platform_fee_percent' => 0,
        ]);

        // Subtotal Rp 120.000 -> 2 kelipatan 50rb (1000) + 1000 flat = Rp 2.000
        $trx = new Transaction(['subtotal' => 120000, 'total_amount' => 120000]);
        $split = $service->calculateSplit($trx, $config);

        $this->assertEquals(2000, $split['platform_fee_amount']);
        $this->assertEquals(118000, $split['tenant_net_amount']);
    }

    public function test_hybrid_fee_calculation()
    {
        $service = new DokuPaymentService();

        $transaction = new Transaction([
            'subtotal'     => 100000,
            'total_amount' => 100000,
        ]);

        $config = new TenantPaymentConfig([
            'fee_type'             => 'hybrid',
            'platform_fee_fixed'   => 1500,
            'platform_fee_percent' => 3.5, // 3.5% = 3500
        ]);

        $split = $service->calculateSplit($transaction, $config);

        // Platform fee = 1500 + 3500 = 5000
        // Tenant net = 100000 - 5000 = 95000
        $this->assertEquals(100000, $split['gross_amount']);
        $this->assertEquals(5000, $split['platform_fee_amount']);
        $this->assertEquals(95000, $split['tenant_net_amount']);
    }

    public function test_sba_settlement_payload_building_active_split()
    {
        config(['doku.main_sba_id' => 'SBA-KILATZ-MAIN']);
        $service = new DokuPaymentService();

        $transaction = new Transaction([
            'subtotal'     => 80000,
            'total_amount' => 80000,
        ]);

        $config = new TenantPaymentConfig([
            'fee_type'                        => 'fixed',
            'platform_fee_fixed'              => 2000,
            'is_split_active'                 => true,
            'doku_settlement_bank_account_id' => 'SBA-WARUNG-KOPI',
        ]);

        $settlementPayload = $service->buildSettlementPayload($transaction, $config);

        $this->assertArrayHasKey('settlement', $settlementPayload);
        $settlements = $settlementPayload['settlement'];
        $this->assertCount(2, $settlements);

        // Kilatz Main Account receives Platform Fee (2000)
        $this->assertEquals('SBA-KILATZ-MAIN', $settlements[0]['account_id']);
        $this->assertEquals(2000, $settlements[0]['amount']);

        // Warung Kopi receives Net Receivable (78000)
        $this->assertEquals('SBA-WARUNG-KOPI', $settlements[1]['account_id']);
        $this->assertEquals(78000, $settlements[1]['amount']);
    }
}
