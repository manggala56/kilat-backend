<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnlineOrderSyncController extends Controller
{
    /**
     * GET /api/v1/online-orders/{id}
     * Menarik rincian utuh 1 transaksi setelah menerima sinyal notifikasi.
     */
    public function show($id)
    {
        $transaction = Transaction::with(['items.product.category', 'tenant'])
            ->where('id', $id)
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $transaction->id,
                'invoice_number' => $transaction->receipt_number ?? $transaction->invoice_number ?? ('ONL-' . $transaction->id),
                'store_id' => $transaction->tenant ? $transaction->tenant->store_id : null,
                'table_number' => $transaction->table_number ?? 'Bungkus',
                'customer_name' => $transaction->customer_name ?? 'Pelanggan',
                'customer_phone' => $transaction->customer_phone,
                'order_type' => $transaction->order_type ?? 'DINE_IN',
                'payment_type' => $transaction->payment_method ?? $transaction->payment_type ?? 'CASH',
                'payment_status' => $transaction->payment_status ?? 'UNPAID',
                'status' => $transaction->status,
                'subtotal' => (float) $transaction->subtotal,
                'tax' => (float) ($transaction->tax_amount ?? 0),
                'discount' => (float) ($transaction->discount_amount ?? 0),
                'total_amount' => (float) $transaction->total_amount,
                'created_at' => $transaction->created_at ? $transaction->created_at->toIso8601String() : now()->toIso8601String(),
                'items' => $transaction->items->map(fn($it) => [
                    'id' => $it->id,
                    'product_id' => $it->product_id,
                    'product_name' => $it->product_name ?? ($it->product ? $it->product->name : 'Item'),
                    'sku' => $it->sku ?? ($it->product ? $it->product->sku : null),
                    'quantity' => $it->quantity,
                    'price' => (float) ($it->price ?? $it->unit_price ?? 0),
                    'subtotal' => (float) $it->subtotal,
                    'notes' => $it->notes,
                    'category_type' => $it->product && $it->product->category ? $it->product->category->name : 'FOOD',
                ]),
            ],
        ]);
    }

    /**
     * GET /api/v1/online-orders/pending
     * Mengambil pesanan online yang belum dikonfirmasi kasir.
     */
    public function pending(Request $request)
    {
        $tenant = null;
        if (app()->bound('tenant')) {
            $tenant = app('tenant');
        } elseif ($request->header('X-Tenant-ID') || $request->query('store_id')) {
            $alias = $request->header('X-Tenant-ID') ?: $request->query('store_id');
            $tenant = \App\Models\Tenant::where('store_id', $alias)->orWhere('id', $alias)->first();
        }

        $query = Transaction::with(['items.product.category'])
            ->where('status', 'pending')
            ->orderByDesc('created_at');

        if ($tenant) {
            $query->where('tenant_id', $tenant->id);
        }

        $orders = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    /**
     * POST /api/v1/online-orders/{id}/confirm
     * Kasir mengonfirmasi pembayaran pesanan online pending.
     */
    public function confirm(Request $request, $id)
    {
        $tenant = null;
        if (app()->bound('tenant')) {
            $tenant = app('tenant');
        } elseif ($request->header('X-Tenant-ID') || $request->query('store_id')) {
            $alias = $request->header('X-Tenant-ID') ?: $request->query('store_id');
            $tenant = \App\Models\Tenant::where('store_id', $alias)->orWhere('id', $alias)->first();
        }

        $query = Transaction::with(['items.product.recipeItems.rawMaterial'])->where('id', $id);
        if ($tenant) {
            $query->where('tenant_id', $tenant->id);
        }

        $transaction = $query->firstOrFail();

        if ($transaction->status === 'completed') {
            return response()->json([
                'status' => 'success',
                'message' => 'Pesanan sudah berstatus selesai sebelumnya.',
                'data' => $transaction,
            ]);
        }

        DB::beginTransaction();
        try {
            $transaction->update([
                'status' => 'completed',
                'payment_status' => 'PAID',
                'amount_paid' => $transaction->total_amount,
                'cashier_id' => $request->user()->id ?? null,
                'transacted_at' => now(),
            ]);

            // Potong stok dan HPP saat pembayaran dikonfirmasi
            foreach ($transaction->items as $item) {
                if ($item->product) {
                    $prod = $item->product;
                    if ($prod->recipeItems->isNotEmpty()) {
                        foreach ($prod->recipeItems as $recipe) {
                            if ($recipe->rawMaterial) {
                                $recipe->rawMaterial->decrement('stock', $recipe->quantity * $item->quantity);
                            }
                        }
                    } else {
                        $prod->decrement('stock', $item->quantity);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pembayaran pesanan online berhasil dikonfirmasi.',
                'data' => $transaction->fresh(['items.product.category']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengonfirmasi pesanan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/online-orders/stream
     * Server-Sent Events (SSE) stream untuk notifikasi real-time instan ke Mobile POS.
     */
    public function stream(Request $request)
    {
        $tenantAlias = $request->query('store_id') ?: $request->header('X-Tenant-ID') ?: 'toko-pusat';
        $cleanStoreId = preg_replace('/[^a-zA-Z0-9-_]/', '', (string)$tenantAlias);
        $topic = 'store_' . $cleanStoreId;

        return response()->stream(function () use ($topic) {
            @set_time_limit(0);
            @ini_set('max_execution_time', '0');
            @ini_set('zlib.output_compression', 0);
            @ini_set('implicit_flush', 1);
            @ignore_user_abort(true);

            while (ob_get_level() > 0) {
                @ob_end_clean();
            }

            echo "event: connected\n";
            echo "data: " . json_encode(['status' => 'connected', 'topic' => $topic, 'time' => time()]) . "\n\n";
            if (ob_get_level() > 0) @ob_flush();
            @flush();

            $lastSignalTime = microtime(true);
            $startTime = time();
            $lastPingTime = time();

            // Stream selama 45 detik per siklus koneksi dengan keepalive ping
            while ((time() - $startTime) < 45) {
                if (connection_aborted()) {
                    break;
                }

                $signal = cache()->get("latest_signal_{$topic}");
                if ($signal && isset($signal['time']) && $signal['time'] > $lastSignalTime) {
                    $lastSignalTime = $signal['time'];
                    echo "event: order_signal\n";
                    echo "data: " . json_encode($signal) . "\n\n";
                    if (ob_get_level() > 0) @ob_flush();
                    @flush();
                }

                // Kirim keep-alive ping setiap 5 detik agar ngrok / cloud proxy tidak memutuskan stream
                if ((time() - $lastPingTime) >= 5) {
                    $lastPingTime = time();
                    echo ": keepalive\n\n";
                    if (ob_get_level() > 0) @ob_flush();
                    @flush();
                }

                usleep(150000); // 150ms check
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);

    }

}

