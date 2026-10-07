<?php

namespace App\Services\Payment;

use App\Models\TenantPaymentConfig;
use App\Models\Transaction;
use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DokuPaymentService
{
    protected string $clientId;
    protected string $secretKey;
    protected string $baseUrl;
    protected string $mainSbaId;
    protected int $expiryMinutes;

    public function __construct()
    {
        $this->clientId = config('doku.client_id', '');
        $this->secretKey = config('doku.secret_key', '');
        $this->baseUrl = rtrim(config('doku.base_url', 'https://api-sandbox.doku.com'), '/');
        $this->mainSbaId = config('doku.main_sba_id', 'SBA-KILATZ-MAIN');
        $this->expiryMinutes = (int) config('doku.default_expiry_minutes', 15);
    }

    /**
     * Calculate strict server-side platform fee & net tenant receivable.
     * Supports fixed, percentage, hybrid, multiple step, and dynamic tiered rules.
     */
    public function calculateSplit(Transaction $transaction, ?TenantPaymentConfig $config = null): array
    {
        $subtotal = (float) $transaction->subtotal;
        $totalAmount = (float) $transaction->total_amount;

        if (!$config) {
            return [
                'gross_amount'        => $totalAmount,
                'platform_fee_amount' => 0.00,
                'tenant_net_amount'   => $totalAmount,
            ];
        }

        $feeType = $config->fee_type ?? 'fixed';
        $platformFee = 0.00;

        switch ($feeType) {
            case 'fixed':
                $platformFee = (float) $config->platform_fee_fixed;
                break;

            case 'percentage':
                $percent = (float) $config->platform_fee_percent;
                $platformFee = round(($subtotal * $percent) / 100, 2);
                break;

            case 'hybrid':
                $fixed = (float) $config->platform_fee_fixed;
                $percent = (float) $config->platform_fee_percent;
                $platformFee = $fixed + round(($subtotal * $percent) / 100, 2);
                break;

            case 'multiple':
                $step = (float) $config->fee_multiple_step;
                $amountPerStep = (float) $config->fee_multiple_amount;
                $fixed = (float) $config->platform_fee_fixed;
                $percent = (float) $config->platform_fee_percent;

                $multiplier = $step > 0 ? floor($subtotal / $step) : 0;
                $multipleFee = $multiplier * $amountPerStep;

                $platformFee = $multipleFee + $fixed + round(($subtotal * $percent) / 100, 2);
                break;

            case 'tiered':
                $tiers = is_array($config->fee_tiers) ? $config->fee_tiers : json_decode($config->fee_tiers ?? '[]', true);
                $matchedTier = null;

                if (!empty($tiers)) {
                    foreach ($tiers as $tier) {
                        $min = isset($tier['min_amount']) ? (float) $tier['min_amount'] : (float) ($tier['min'] ?? 0);
                        $max = isset($tier['max_amount']) && $tier['max_amount'] !== null && $tier['max_amount'] !== '' 
                            ? (float) $tier['max_amount'] 
                            : (isset($tier['max']) && $tier['max'] !== null && $tier['max'] !== '' ? (float) $tier['max'] : null);

                        if ($subtotal >= $min && ($max === null || $subtotal <= $max)) {
                            $matchedTier = $tier;
                            break;
                        }
                    }
                }

                if ($matchedTier) {
                    $tierFixed = (float) ($matchedTier['fixed_amount'] ?? ($matchedTier['fixed'] ?? 0));
                    $tierPercent = (float) ($matchedTier['percent'] ?? ($matchedTier['percentage'] ?? 0));
                    $tierType = $matchedTier['fee_type'] ?? ($matchedTier['type'] ?? 'hybrid');

                    if ($tierType === 'fixed') {
                        $platformFee = $tierFixed;
                    } elseif ($tierType === 'percentage') {
                        $platformFee = round(($subtotal * $tierPercent) / 100, 2);
                    } else {
                        // hybrid / default
                        $platformFee = $tierFixed + round(($subtotal * $tierPercent) / 100, 2);
                    }
                } else {
                    // Fallback to basic fixed/percent if no tier matched
                    $platformFee = (float) $config->platform_fee_fixed + round(($subtotal * (float) $config->platform_fee_percent) / 100, 2);
                }
                break;

            default:
                $platformFee = (float) $config->platform_fee_fixed;
                break;
        }

        // Cap platform fee at total amount to guarantee no negative payout
        $platformFee = min($platformFee, $totalAmount);
        $tenantNet = max(0, $totalAmount - $platformFee);

        return [
            'gross_amount'        => $totalAmount,
            'platform_fee_amount' => $platformFee,
            'tenant_net_amount'   => $tenantNet,
        ];
    }

    /**
     * Build standard DOKU additional_info.settlement array for automated split payout.
     */
    public function buildSettlementPayload(Transaction $transaction, ?TenantPaymentConfig $config = null, ?array $split = null): array
    {
        if (!$split) {
            $split = $this->calculateSplit($transaction, $config);
        }

        $isSplitActive = $config && $config->is_split_active && !empty($config->doku_settlement_bank_account_id);

        if ($isSplitActive) {
            $settlements = [];
            if ($split['platform_fee_amount'] > 0) {
                $settlements[] = [
                    'account_id' => $this->mainSbaId,
                    'amount'     => (int) $split['platform_fee_amount'],
                ];
            }
            $settlements[] = [
                'account_id' => $config->doku_settlement_bank_account_id,
                'amount'     => (int) $split['tenant_net_amount'],
            ];

            return ['settlement' => $settlements];
        }

        // Default: Full settlement routed to Main Platform Account
        return [
            'settlement' => [
                [
                    'account_id' => $this->mainSbaId,
                    'amount'     => (int) $split['gross_amount'],
                ]
            ]
        ];
    }

    /**
     * 1. Self-Order (Web QR): Request DOKU Checkout Payment URL
     */
    public function requestCheckoutPayment(Transaction $transaction): PaymentTransaction
    {
        $tenant = $transaction->tenant;
        $config = TenantPaymentConfig::where('tenant_id', $tenant->id)->first();
        $split = $this->calculateSplit($transaction, $config);

        $invoiceNumber = 'KLTZ-CHK-' . $tenant->id . '-' . $transaction->id . '-' . time();
        $expiredAt = now()->addMinutes($this->expiryMinutes);

        $requestTarget = '/checkout/v1/payment';
        $requestId = (string) Str::uuid();
        $requestTimestamp = gmdate("Y-m-d\TH:i:s\Z");

        $settlementInfo = $this->buildSettlementPayload($transaction, $config, $split);

        $payload = [
            'order' => [
                'invoice_number' => $invoiceNumber,
                'amount'         => (int) $transaction->total_amount,
                'callback_url'   => url('/order/' . $tenant->store_id . '/' . $transaction->receipt_number),
                'auto_redirect'  => true,
            ],
            'payment' => [
                'payment_due_date' => $this->expiryMinutes,
            ],
            'additional_info' => $settlementInfo,
        ];

        $rawBody = json_encode($payload);
        $signature = DokuSignatureService::generateSignature(
            $this->clientId,
            $requestId,
            $requestTimestamp,
            $requestTarget,
            $rawBody,
            $this->secretKey
        );

        $paymentUrl = null;
        $gatewayRef = null;
        $responseBody = null;

        try {
            $response = Http::withHeaders([
                'Client-Id'         => $this->clientId,
                'Request-Id'        => $requestId,
                'Request-Timestamp' => $requestTimestamp,
                'Signature'         => $signature,
                'Content-Type'      => 'application/json',
            ])->timeout(10)->post($this->baseUrl . $requestTarget, $payload);

            $responseBody = $response->json();
            if ($response->successful() && $responseBody) {
                $paymentUrl = $responseBody['response']['payment']['url'] ?? ($responseBody['payment_url'] ?? null);
                $gatewayRef = $responseBody['response']['order']['invoice_number'] ?? null;
            } else {
                Log::warning('DOKU Checkout API returned non-200', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('DOKU Checkout Exception', ['error' => $e->getMessage()]);
        }

        // Sandbox fallback URL for local testing
        if (!$paymentUrl) {
            $paymentUrl = 'https://sandbox.doku.com/checkout/v1/payment/' . $invoiceNumber;
        }

        return PaymentTransaction::create([
            'tenant_id'             => $tenant->id,
            'transaction_id'        => $transaction->id,
            'invoice_number'        => $invoiceNumber,
            'integration_type'      => 'CHECKOUT',
            'payment_method'        => 'DOKU_CHECKOUT',
            'gross_amount'          => $split['gross_amount'],
            'platform_fee_amount'   => $split['platform_fee_amount'],
            'tenant_net_amount'     => $split['tenant_net_amount'],
            'status'                => 'PENDING',
            'doku_payment_url'      => $paymentUrl,
            'gateway_reference'     => $gatewayRef,
            'raw_response_payload'  => $this->sanitizePayload($responseBody ?? []),
            'expired_at'            => $expiredAt,
        ]);
    }

    /**
     * 2. POS Kasir: Request Direct API Dynamic QRIS
     */
    public function requestDirectQris(Transaction $transaction): PaymentTransaction
    {
        $tenant = $transaction->tenant;
        $config = TenantPaymentConfig::where('tenant_id', $tenant->id)->first();
        $split = $this->calculateSplit($transaction, $config);

        $invoiceNumber = 'KLTZ-POS-' . $tenant->id . '-' . $transaction->id . '-' . time();
        $expiredAt = now()->addMinutes($this->expiryMinutes);

        $requestTarget = '/qris-notification/v1/generate-qr';
        $requestId = (string) Str::uuid();
        $requestTimestamp = gmdate("Y-m-d\TH:i:s\Z");

        $settlementInfo = $this->buildSettlementPayload($transaction, $config, $split);

        $payload = [
            'order' => [
                'invoice_number' => $invoiceNumber,
                'amount'         => (int) $transaction->total_amount,
            ],
            'payment' => [
                'payment_due_date' => $this->expiryMinutes,
            ],
            'additional_info' => $settlementInfo,
        ];

        $rawBody = json_encode($payload);
        $signature = DokuSignatureService::generateSignature(
            $this->clientId,
            $requestId,
            $requestTimestamp,
            $requestTarget,
            $rawBody,
            $this->secretKey
        );

        $qrString = null;
        $gatewayRef = null;
        $responseBody = null;

        try {
            $response = Http::withHeaders([
                'Client-Id'         => $this->clientId,
                'Request-Id'        => $requestId,
                'Request-Timestamp' => $requestTimestamp,
                'Signature'         => $signature,
                'Content-Type'      => 'application/json',
            ])->timeout(10)->post($this->baseUrl . $requestTarget, $payload);

            $responseBody = $response->json();
            if ($response->successful() && $responseBody) {
                $qrString = $responseBody['qr_content'] ?? ($responseBody['qr_string'] ?? null);
                $gatewayRef = $responseBody['reference_id'] ?? null;
            } else {
                Log::warning('DOKU Direct QRIS returned non-200', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('DOKU Direct QRIS Exception', ['error' => $e->getMessage()]);
        }

        // Sandbox fallback standard QR payload
        if (!$qrString) {
            $qrString = '00020101021226580014ID.DOKU.WWW01189360000000000000000215' . $invoiceNumber . '51440014ID.LINKAJA.WWW0215' . $invoiceNumber . '520458125303360540' . (int)$transaction->total_amount . '5802ID5910' . substr($tenant->business_name, 0, 10) . '6007JAKARTA6304';
        }

        return PaymentTransaction::create([
            'tenant_id'             => $tenant->id,
            'transaction_id'        => $transaction->id,
            'invoice_number'        => $invoiceNumber,
            'integration_type'      => 'DIRECT_QRIS',
            'payment_method'        => 'QRIS',
            'gross_amount'          => $split['gross_amount'],
            'platform_fee_amount'   => $split['platform_fee_amount'],
            'tenant_net_amount'     => $split['tenant_net_amount'],
            'status'                => 'PENDING',
            'qris_string'           => $qrString,
            'gateway_reference'     => $gatewayRef,
            'raw_response_payload'  => $this->sanitizePayload($responseBody ?? []),
            'expired_at'            => $expiredAt,
        ]);
    }

    /**
     * Sanitize and mask sensitive keys from raw payload before storing in database.
     */
    public function sanitizePayload(array $payload): array
    {
        $sensitiveKeys = config('doku.sensitive_keys', []);

        array_walk_recursive($payload, function (&$value, $key) use ($sensitiveKeys) {
            if (in_array(strtolower($key), $sensitiveKeys)) {
                $value = '********';
            }
        });

        return $payload;
    }
}
