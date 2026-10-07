<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Models\Transaction;
use App\Services\FirebaseNotificationService;
use App\Services\Payment\DokuPaymentService;
use App\Services\Payment\DokuSignatureService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DokuNotificationController extends Controller
{
    /**
     * POST /api/v1/payments/doku/notifications
     * Unified Webhook listener for DOKU Checkout & Direct QRIS notifications.
     */
    public function handleNotification(Request $request, DokuPaymentService $dokuService)
    {
        $clientId = $request->header('Client-Id', '');
        $requestId = $request->header('Request-Id', '');
        $requestTimestamp = $request->header('Request-Timestamp', '');
        $signature = $request->header('Signature', '');
        $rawBody = $request->getContent();
        $requestTarget = '/' . ltrim($request->path(), '/');

        Log::info('DOKU Webhook Notification received', [
            'headers' => [
                'Client-Id'         => $clientId,
                'Request-Id'        => $requestId,
                'Request-Timestamp' => $requestTimestamp,
                'Signature'         => $signature,
            ],
            'path' => $requestTarget,
        ]);

        // 1. Strict HMAC-SHA256 Signature Authentication
        $isValidSignature = DokuSignatureService::verifySignature(
            $signature,
            $clientId,
            $requestId,
            $requestTimestamp,
            $requestTarget,
            $rawBody
        );

        if (!$isValidSignature && config('doku.environment') === 'production') {
            Log::warning('DOKU Webhook Signature verification failed', [
                'received_signature' => $signature,
                'client_id'          => $clientId,
                'request_id'         => $requestId,
            ]);

            return response()->json([
                'error'   => 'UNAUTHORIZED',
                'message' => 'Invalid webhook signature.',
            ], 401);
        }

        // 2. Parse Invoice Number and Status
        $payload = $request->all();
        $order = $payload['order'] ?? [];
        $invoiceNumber = $order['invoice_number'] ?? ($payload['invoice_number'] ?? null);

        if (!$invoiceNumber) {
            return response()->json([
                'error'   => 'BAD_REQUEST',
                'message' => 'Invoice number missing from payload.',
            ], 400);
        }

        $trxStatus = strtoupper($payload['transaction']['status'] ?? ($payload['status'] ?? 'SUCCESS'));
        $gatewayRef = $payload['transaction']['reference_id'] ?? ($payload['reference_id'] ?? null);
        $paymentChannel = $payload['payment']['channel'] ?? ($payload['channel'] ?? null);

        $sanitizedPayload = $dokuService->sanitizePayload($payload);

        // 3. Strict Idempotency with Row-Level Database Lock
        return DB::transaction(function () use (
            $invoiceNumber,
            $trxStatus,
            $gatewayRef,
            $paymentChannel,
            $sanitizedPayload
        ) {
            $paymentTransaction = PaymentTransaction::where('invoice_number', $invoiceNumber)
                ->lockForUpdate()
                ->first();

            if (!$paymentTransaction) {
                Log::warning("DOKU Webhook: Invoice {$invoiceNumber} not found.");
                return response()->json([
                    'error'   => 'NOT_FOUND',
                    'message' => "Payment session {$invoiceNumber} not found.",
                ], 404);
            }

            // If already marked PAID, return idempotent 200 OK immediately without re-execution
            if ($paymentTransaction->status === 'PAID') {
                Log::info("DOKU Webhook: Invoice {$invoiceNumber} is already PAID. Idempotency guard triggered.");
                return response()->json([
                    'status'  => 'ALREADY_PROCESSED',
                    'message' => 'Payment already settled.',
                ], 200);
            }

            if ($trxStatus === 'SUCCESS') {
                $paymentTransaction->update([
                    'status'               => 'PAID',
                    'payment_method'       => $paymentChannel ?: $paymentTransaction->payment_method,
                    'gateway_reference'    => $gatewayRef ?: $paymentTransaction->gateway_reference,
                    'paid_at'              => now(),
                    'raw_response_payload' => $sanitizedPayload,
                ]);

                $transaction = $paymentTransaction->transaction;
                if ($transaction) {
                    $transaction->update([
                        'payment_status' => 'PAID',
                        'status'         => 'pending', // Queue order for kitchen & POS preparation
                        'amount_paid'    => $transaction->total_amount,
                    ]);

                    // Deduct stock for items & raw material recipes
                    $transaction->load(['items.product.recipeItems.rawMaterial', 'items.productVariant']);
                    foreach ($transaction->items as $item) {
                        $product = $item->product;
                        if ($product) {
                            if ($product->recipeItems->isNotEmpty()) {
                                foreach ($product->recipeItems as $recipe) {
                                    if ($recipe->rawMaterial) {
                                        $recipe->rawMaterial->decrement('stock', $recipe->quantity * $item->quantity);
                                    }
                                }
                            } else {
                                $product->decrement('stock', $item->quantity);
                            }
                        }

                        if ($item->productVariant) {
                            $item->productVariant->decrement('stock', $item->quantity);
                        }
                    }

                    // Dispatch Realtime Signal to POS Kasir & Kitchen Display System (KDS)
                    $tenant = $paymentTransaction->tenant;
                    if ($tenant) {
                        FirebaseNotificationService::sendOrderSignal(
                            $tenant->store_id,
                            $transaction->status,
                            $transaction->id
                        );
                    }
                }
            } else {
                // Handle EXPIRED / FAILED / CANCELLED
                $statusEnum = in_array($trxStatus, ['EXPIRED', 'FAILED']) ? $trxStatus : 'FAILED';
                $paymentTransaction->update([
                    'status'               => $statusEnum,
                    'raw_response_payload' => $sanitizedPayload,
                ]);

                $transaction = $paymentTransaction->transaction;
                if ($transaction && $transaction->payment_status === 'UNPAID') {
                    $transaction->update([
                        'payment_status' => $statusEnum,
                        'status'         => 'voided',
                    ]);
                }
            }

            return response()->json([
                'status'  => 'OK',
                'message' => 'Notification processed successfully.',
            ], 200);
        });
    }
}
