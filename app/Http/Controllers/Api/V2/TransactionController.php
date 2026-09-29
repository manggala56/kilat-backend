<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller
{
    /**
     * POST /api/v2/transactions
     * Checkout transaksi baru & auto-deduct stok produk / raw materials.
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validator = Validator::make($request->all(), [
            'invoice_number'     => 'required|string',
            'total_amount'       => 'required|numeric|min:0',
            'payment_method'     => 'required|string',
            'cashier_id'         => 'nullable|integer',
            'cashier_session_id' => 'nullable|integer',
            'customer_name'      => 'nullable|string',
            'customer_phone'     => 'nullable|string',
            'table_number'       => 'nullable|string',
            'order_type'         => 'nullable|string',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'nullable|integer',
            'items.*.product_name' => 'nullable|string',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.subtotal'   => 'required|numeric|min:0',
            'items.*.notes'      => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data transaksi tidak valid.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        return DB::transaction(function () use ($validated, $tenant) {
            // Idempotency check: jika invoice_number sudah ada, kembalikan transaksi yang ada
            $existing = Transaction::where('tenant_id', $tenant->id)
                ->where('receipt_number', $validated['invoice_number'])
                ->first();

            if ($existing) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Transaksi sudah pernah tersinkronkan.',
                    'data'    => $existing->load('items'),
                ], 200);
            }

            // Buat transaksi baru
            $transaction = Transaction::create([
                'tenant_id'          => $tenant->id,
                'receipt_number'     => $validated['invoice_number'],
                'cashier_id'         => $validated['cashier_id'] ?? null,
                'cashier_session_id' => $validated['cashier_session_id'] ?? null,
                'subtotal'           => $validated['total_amount'],
                'total_amount'       => $validated['total_amount'],
                'payment_method'     => strtolower($validated['payment_method']),
                'status'             => 'completed',
                'customer_name'      => $validated['customer_name'] ?? null,
                'customer_phone'     => $validated['customer_phone'] ?? null,
                'table_number'       => $validated['table_number'] ?? null,
                'order_type'         => $validated['order_type'] ?? 'dine_in',
                'transacted_at'      => now(),
            ]);

            foreach ($validated['items'] as $item) {
                $product = null;
                if (!empty($item['product_id'])) {
                    $product = Product::with('recipeItems.rawMaterial')
                        ->where('tenant_id', $tenant->id)
                        ->where('id', $item['product_id'])
                        ->first();
                }

                $productName = $item['product_name'] ?? ($product ? $product->name : 'Item');

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id'     => $product ? $product->id : null,
                    'product_name'   => $productName,
                    'quantity'       => $item['quantity'],
                    'unit_price'     => $item['unit_price'],
                    'subtotal'       => $item['subtotal'],
                    'notes'          => $item['notes'] ?? null,
                ]);

                // Kurangi stok jika produk terdaftar
                if ($product) {
                    if ($product->recipeItems && $product->recipeItems->isNotEmpty()) {
                        foreach ($product->recipeItems as $recipe) {
                            if ($recipe->rawMaterial) {
                                $needed = $recipe->quantity * $item['quantity'];
                                $recipe->rawMaterial->decrement('stock', $needed);
                            }
                        }
                    } else {
                        $product->decrement('stock', $item['quantity']);
                    }
                }
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Transaksi berhasil disimpan.',
                'data'    => $transaction->load('items'),
            ], 201);
        });
    }

    /**
     * GET /api/v2/transactions
     * Riwayat transaksi per tenant
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $query = Transaction::with(['items', 'cashier'])
            ->where('tenant_id', $tenant->id)
            ->latest('transacted_at');

        if ($request->has('limit')) {
            $transactions = $query->limit((int) $request->limit)->get();
        } else {
            $transactions = $query->paginate(20);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $transactions,
        ]);
    }

    /**
     * POST /api/v2/transactions/{invoice}/cancel-item
     */
    public function cancelItem(Request $request, $invoice)
    {
        $tenant = app('tenant');

        $request->validate([
            'product_id' => 'required|integer',
        ]);

        $transaction = Transaction::where('tenant_id', $tenant->id)
            ->where('receipt_number', $invoice)
            ->first();

        if (! $transaction) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        $item = TransactionItem::where('transaction_id', $transaction->id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($item) {
            $item->update(['is_cancelled' => true]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Item transaksi berhasil dibatalkan.',
        ]);
    }
}
