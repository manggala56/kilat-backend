<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * POST /api/v1/transactions
     * Checkout — buat transaksi baru + kurangi stok otomatis.
     */
    public function store(Request $request)
    {
        \Log::info("Incoming Transaction Payload: " . json_encode($request->all()));
        \Log::info("Auth User: " . json_encode($request->user() ? ['id' => $request->user()->id, 'role' => $request->user()->role ?? 'N/A', 'tenant_id' => $request->user()->tenant_id ?? 'N/A'] : 'NO USER'));
        \Log::info("X-Tenant-ID header: " . ($request->header('X-Tenant-ID') ?? 'MISSING'));
        
        $tenant = app('tenant');
        \Log::info("Resolved Tenant: " . ($tenant ? "ID={$tenant->id}, Name={$tenant->business_name}" : 'NULL'));

        $validated = $request->validate([
            'invoice_number'   => 'required|string',
            'total_amount'     => 'required|numeric|min:0',
            'payment_method'   => 'required|string|in:CASH,QRIS,DEBIT',
            'cashier_id'       => 'nullable|integer',
            'cashier_session_id' => 'nullable|integer',
            'items'            => 'required|array|min:1',
            'items.*.product_id' => 'nullable|integer',
            'items.*.product_name' => 'nullable|string',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.subtotal'   => 'required|numeric|min:0',
            'items.*.notes'      => 'nullable|string',
            'customer_name'      => 'nullable|string',
            'table_number'       => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $existingTransaction = Transaction::where('receipt_number', $validated['invoice_number'])->first();
            if ($existingTransaction) {
                DB::rollBack();
                return response()->json($existingTransaction, 200);
            }

            $transaction = Transaction::create([
                'receipt_number' => $validated['invoice_number'],
                'tenant_id'      => $tenant->id,
                'cashier_id'     => $validated['cashier_id'] ?? null,
                'cashier_session_id' => $validated['cashier_session_id'] ?? null,
                'subtotal'       => $validated['total_amount'],
                'total_amount'   => $validated['total_amount'],
                'payment_method' => strtolower($validated['payment_method']),
                'status'         => 'completed',
                'customer_name'  => $validated['customer_name'] ?? null,
                'table_number'   => $validated['table_number'] ?? null,
                'transacted_at'  => now(),
            ]);

            foreach ($validated['items'] as $item) {
                $product = null;
                if (!empty($item['product_id'])) {
                    $product = Product::with('recipeItems.rawMaterial')
                        ->where('id', $item['product_id'])
                        ->where('tenant_id', $tenant->id)
                        ->first();
                }

                $productName = $item['product_name'] ?? ($product ? $product->name : 'Unknown Product');

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id'     => $product ? $product->id : null,
                    'product_name'   => $productName,
                    'quantity'       => $item['quantity'],
                    'unit_price'     => $item['unit_price'],
                    'subtotal'       => $item['subtotal'],
                    'notes'          => $item['notes'] ?? null,
                ]);

                if ($product) {
                    if ($product->recipeItems->isNotEmpty()) {
                        // Kurangi stok bahan mentah (Raw Materials)
                        foreach ($product->recipeItems as $recipe) {
                            if ($recipe->rawMaterial) {
                                $deduction = $recipe->quantity * $item['quantity'];
                                $recipe->rawMaterial->decrement('stock', $deduction);
                            }
                        }
                    } else {
                        // Kurangi stok produk secara langsung (Perilaku default)
                        $product->decrement('stock', $item['quantity']);
                    }
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Transaction Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Server error occurred.', 'debug' => $e->getMessage()], 500);
        }

        return response()->json([
            'data' => [
                'id'             => $transaction->id,
                'invoice_number' => $transaction->receipt_number,
                'total_amount'   => (float) $transaction->total_amount,
                'payment_method' => strtoupper($transaction->payment_method),
                'cashier_id'     => $transaction->cashier_id,
                'created_at'     => $transaction->transacted_at?->toISOString(),
                'status'         => 'COMPLETED',
            ],
            'message' => 'Transaction completed successfully',
        ], 201);
    }

    /**
     * GET /api/v1/transactions
     * Ambil history transaksi tenant.
     */
    public function index()
    {
        $tenant = app('tenant');

        $transactions = Transaction::where('tenant_id', $tenant->id)
            ->orderByDesc('transacted_at')
            ->get()
            ->map(fn ($t) => [
                'id'             => $t->id,
                'invoice_number' => $t->receipt_number,
                'total_amount'   => (float) $t->total_amount,
                'payment_method' => strtoupper($t->payment_method),
                'cashier_id'     => $t->cashier_id,
                'created_at'     => $t->transacted_at?->toISOString(),
                'status'         => strtoupper($t->status),
            ]);

        return response()->json(['data' => $transactions]);
    }

    /**
     * POST /api/v1/transactions/{invoice}/cancel-item
     * Cancel an item from a completed transaction.
     */
    public function cancelItem(Request $request, $invoice)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
        ]);

        $transaction = Transaction::where('tenant_id', $tenant->id)
            ->where('receipt_number', $invoice)
            ->firstOrFail();

        $item = TransactionItem::where('transaction_id', $transaction->id)
            ->where('product_id', $validated['product_id'])
            ->where('is_cancelled', false)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Mark item as cancelled
            $item->update(['is_cancelled' => true]);

            // Deduct transaction totals
            $transaction->subtotal -= $item->subtotal;
            $transaction->total_amount -= $item->subtotal;
            $transaction->save();

            // Refund stock
            $product = Product::with('recipeItems.rawMaterial')
                ->where('id', $item->product_id)
                ->where('tenant_id', $tenant->id)
                ->first();

            if ($product) {
                if ($product->recipeItems->isNotEmpty()) {
                    foreach ($product->recipeItems as $recipe) {
                        if ($recipe->rawMaterial) {
                            $refund = $recipe->quantity * $item->quantity;
                            $recipe->rawMaterial->increment('stock', $refund);
                        }
                    }
                } else {
                    $product->increment('stock', $item->quantity);
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Server error occurred during cancellation.'], 500);
        }

        return response()->json([
            'message' => 'Item cancelled successfully',
            'new_total' => $transaction->total_amount
        ]);
    }

    /**
     * GET /api/v1/transactions/{id}/items
     * Detail item-item dalam satu transaksi.
     */
    public function items($id)
    {
        $tenant = app('tenant');

        $transaction = Transaction::where('tenant_id', $tenant->id)->findOrFail($id);

        $items = TransactionItem::with('product:id,name')
            ->where('transaction_id', $transaction->id)
            ->get()
            ->map(fn ($item) => [
                'id'           => $item->id,
                'product_id'   => $item->product_id,
                'product_name' => $item->product?->name,
                'quantity'     => (int) $item->quantity,
                'unit_price'   => (float) $item->unit_price,
                'subtotal'     => (float) $item->subtotal,
                'is_cancelled' => (bool) $item->is_cancelled,
            ]);

        return response()->json(['data' => $items]);
    }
}
