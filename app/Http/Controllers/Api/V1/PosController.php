<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PosController extends Controller
{
    /**
     * POST /api/v1/pos/checkout
     * Process a single receipt in real-time.
     * Automatically deducts stock.
     */
    public function checkout(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'payment_method' => 'required|in:cash,qris,transfer',
            'amount_paid' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:255',
            'transacted_at' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $transaction = DB::transaction(function () use ($validated, $tenant, $request) {
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $product = Product::where('tenant_id', $tenant->id)
                    ->findOrFail($item['product_id']);

                $unitPrice = $product->price;

                // If variant, add the additional price
                if (!empty($item['product_variant_id'])) {
                    $variant = $product->variants()->findOrFail($item['product_variant_id']);
                    $unitPrice += $variant->additional_price;

                    // Deduct variant stock
                    if ($variant->stock < $item['quantity']) {
                        abort(422, "Stok varian '{$variant->name}' tidak cukup.");
                    }
                    $variant->decrement('stock', $item['quantity']);
                } else {
                    // Deduct product stock
                    if ($product->stock < $item['quantity']) {
                        abort(422, "Stok produk '{$product->name}' tidak cukup.");
                    }
                    $product->decrement('stock', $item['quantity']);
                }

                $itemSubtotal = $unitPrice * $item['quantity'];
                $subtotal += $itemSubtotal;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'product_name' => $product->name,
                    'unit_price' => $unitPrice,
                    'quantity' => $item['quantity'],
                    'subtotal' => $itemSubtotal,
                ];
            }

            $discountAmount = $validated['discount_amount'] ?? 0;
            $totalAmount = $subtotal - $discountAmount;
            $changeAmount = $validated['amount_paid'] - $totalAmount;

            $transaction = Transaction::create([
                'receipt_number' => 'RCP-' . strtoupper(Str::random(10)),
                'tenant_id' => $tenant->id,
                'cashier_id' => $request->user()?->id,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => 0,
                'total_amount' => $totalAmount,
                'amount_paid' => $validated['amount_paid'],
                'change_amount' => $changeAmount,
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
                'is_offline_sync' => false,
                'transacted_at' => $validated['transacted_at'] ?? now(),
            ]);

            $transaction->items()->createMany($itemsData);

            return $transaction;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi berhasil.',
            'data' => $transaction->load('items'),
        ], 201);
    }

    /**
     * POST /api/v1/pos/sync-offline
     * Receive a bulk array of offline transactions and process them.
     */
    public function syncOffline(Request $request)
    {
        $tenant = app('tenant');

        $request->validate([
            'transactions' => 'required|array|min:1',
            'transactions.*.payment_method' => 'required|in:cash,qris,transfer',
            'transactions.*.amount_paid' => 'required|numeric|min:0',
            'transactions.*.discount_amount' => 'nullable|numeric|min:0',
            'transactions.*.transacted_at' => 'required|date',
            'transactions.*.items' => 'required|array|min:1',
            'transactions.*.items.*.product_id' => 'required|integer|exists:products,id',
            'transactions.*.items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'transactions.*.items.*.quantity' => 'required|integer|min:1',
        ]);

        $results = ['synced' => [], 'failed' => []];

        foreach ($request->transactions as $index => $txData) {
            try {
                DB::transaction(function () use ($txData, $tenant, $request, &$results, $index) {
                    $subtotal = 0;
                    $itemsData = [];

                    foreach ($txData['items'] as $item) {
                        $product = Product::where('tenant_id', $tenant->id)
                            ->findOrFail($item['product_id']);

                        $unitPrice = $product->price;

                        if (!empty($item['product_variant_id'])) {
                            $variant = $product->variants()->findOrFail($item['product_variant_id']);
                            $unitPrice += $variant->additional_price;
                            $variant->decrement('stock', $item['quantity']);
                        } else {
                            $product->decrement('stock', $item['quantity']);
                        }

                        $itemSubtotal = $unitPrice * $item['quantity'];
                        $subtotal += $itemSubtotal;

                        $itemsData[] = [
                            'product_id' => $product->id,
                            'product_variant_id' => $item['product_variant_id'] ?? null,
                            'product_name' => $product->name,
                            'unit_price' => $unitPrice,
                            'quantity' => $item['quantity'],
                            'subtotal' => $itemSubtotal,
                        ];
                    }

                    $discountAmount = $txData['discount_amount'] ?? 0;
                    $totalAmount = $subtotal - $discountAmount;
                    $changeAmount = $txData['amount_paid'] - $totalAmount;

                    $transaction = Transaction::create([
                        'receipt_number' => 'RCP-OFFL-' . strtoupper(Str::random(8)),
                        'tenant_id' => $tenant->id,
                        'cashier_id' => $request->user()?->id,
                        'subtotal' => $subtotal,
                        'discount_amount' => $discountAmount,
                        'tax_amount' => 0,
                        'total_amount' => $totalAmount,
                        'amount_paid' => $txData['amount_paid'],
                        'change_amount' => $changeAmount,
                        'payment_method' => $txData['payment_method'],
                        'status' => 'completed',
                        'is_offline_sync' => true,
                        'transacted_at' => $txData['transacted_at'],
                    ]);

                    $transaction->items()->createMany($itemsData);
                    $results['synced'][] = $transaction->receipt_number;
                });
            } catch (\Throwable $e) {
                $results['failed'][] = [
                    'index' => $index,
                    'reason' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => count($results['synced']) . ' transaksi berhasil disinkronkan.',
            'data' => $results,
        ]);
    }
}
