<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Product;
use Illuminate\Http\Request;

class OnlineOrderSyncController extends Controller
{
    /**
     * GET /api/v2/online-orders/{id}
     */
    public function show($id)
    {
        $tenant = app('tenant');

        $transaction = Transaction::with(['items.product.category', 'tenant'])
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'             => $transaction->id,
                'invoice_number' => $transaction->receipt_number ?? ('ONL-' . $transaction->id),
                'store_id'       => $tenant->store_id,
                'table_number'   => $transaction->table_number ?? 'Bungkus',
                'customer_name'  => $transaction->customer_name ?? 'Pelanggan',
                'customer_phone' => $transaction->customer_phone,
                'order_type'     => $transaction->order_type ?? 'DINE_IN',
                'payment_type'   => $transaction->payment_method ?? 'CASH',
                'payment_status' => $transaction->payment_status ?? 'UNPAID',
                'status'         => $transaction->status,
                'subtotal'       => (float) $transaction->subtotal,
                'total_amount'   => (float) $transaction->total_amount,
                'created_at'     => $transaction->created_at ? $transaction->created_at->toIso8601String() : now()->toIso8601String(),
                'items'          => $transaction->items->map(fn($it) => [
                    'id'            => $it->id,
                    'product_id'    => $it->product_id,
                    'product_name'  => $it->product_name ?? ($it->product ? $it->product->name : 'Item'),
                    'quantity'      => $it->quantity,
                    'price'         => (float) $it->unit_price,
                    'subtotal'      => (float) $it->subtotal,
                    'notes'         => $it->notes,
                ]),
            ],
        ]);
    }

    /**
     * GET /api/v2/online-orders/pending
     */
    public function pending(Request $request)
    {
        $tenant = app('tenant');

        $pending = Transaction::with(['items.product.category'])
            ->where('tenant_id', $tenant->id)
            ->where('status', 'pending')
            ->latest('created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $pending->map(fn($tx) => [
                'id'             => $tx->id,
                'invoice_number' => $tx->receipt_number ?? ('ONL-' . $tx->id),
                'table_number'   => $tx->table_number ?? '-',
                'customer_name'  => $tx->customer_name ?? 'Pelanggan',
                'customer_phone' => $tx->customer_phone,
                'total_amount'   => (float) $tx->total_amount,
                'items_count'    => $tx->items->sum('quantity'),
                'created_at'     => $tx->created_at ? $tx->created_at->toIso8601String() : now()->toIso8601String(),
            ]),
        ]);
    }

    /**
     * POST /api/v2/online-orders/{id}/confirm
     */
    public function confirm(Request $request, $id)
    {
        $tenant = app('tenant');

        $transaction = Transaction::where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        $transaction->update([
            'status' => 'completed',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Pesanan online berhasil dikonfirmasi.',
            'data'    => $transaction,
        ]);
    }

    /**
     * POST /api/v2/online-orders/{id}/complete
     */
    public function complete(Request $request, $id)
    {
        $tenant = app('tenant');

        $transaction = Transaction::where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        $transaction->update([
            'status' => 'completed',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Pesanan online selesai.',
            'data'    => $transaction,
        ]);
    }
}
