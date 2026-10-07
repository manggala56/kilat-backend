<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\Payment\DokuPaymentService;
use Illuminate\Http\Request;

class PosPaymentController extends Controller
{
    /**
     * POST /api/v1/pos/orders/{order_id}/pay-qris
     * Generates instant Dynamic QRIS payload for Cashier Tablet display & ESC/POS thermal printing.
     */
    public function generateQris(Request $request, string $orderId, DokuPaymentService $dokuService)
    {
        $tenant = $request->get('tenant');
        $tenantId = $tenant ? $tenant->id : $request->user()->tenant_id;

        $transaction = Transaction::where('tenant_id', $tenantId)
            ->where(function ($q) use ($orderId) {
                $q->where('id', $orderId)
                  ->orWhere('receipt_number', $orderId);
            })
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi / Pesanan tidak ditemukan.',
            ], 404);
        }

        if ($transaction->payment_status === 'PAID') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah lunas.',
            ], 400);
        }

        // Gate: Tenant must have APPROVED KYC
        $tenantModel = $transaction->tenant ?? \App\Models\Tenant::find($tenantId);
        if (!$tenantModel || !$tenantModel->is_qris_approved) {
            $kyc = $tenantModel?->kyc;
            $kycStatus = $kyc?->status ?? 'unsubmitted';

            return response()->json([
                'success'          => false,
                'message'          => 'Fitur QRIS Dinamis belum aktif. Outlet wajib melengkapi verifikasi KYC (KTP, Bank, Foto Usaha) dan disetujui oleh Admin.',
                'kyc_status'       => $kycStatus,
                'rejection_reason' => $kyc?->rejection_reason,
            ], 403);
        }

        $paymentTx = $dokuService->requestDirectQris($transaction);

        return response()->json([
            'success' => true,
            'message' => 'QRIS Dinamis berhasil dibuat.',
            'data'    => [
                'transaction_id'    => $transaction->id,
                'receipt_number'    => $transaction->receipt_number,
                'invoice_number'    => $paymentTx->invoice_number,
                'integration_type'  => $paymentTx->integration_type,
                'qris_string'       => $paymentTx->qris_string,
                'gross_amount'      => (float) $paymentTx->gross_amount,
                'status'            => $paymentTx->status,
                'expired_at'        => $paymentTx->expired_at?->toIso8601String(),
                'escpos_data'       => [
                    'qr_data'   => $paymentTx->qris_string,
                    'title'     => 'QRIS ' . ($tenant ? $tenant->business_name : 'KILATZ'),
                    'amount'    => (float) $paymentTx->gross_amount,
                    'invoice'   => $paymentTx->invoice_number,
                ]
            ]
        ], 200);
    }
}
