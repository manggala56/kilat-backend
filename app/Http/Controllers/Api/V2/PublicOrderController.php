<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Room;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\FirebaseNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PublicOrderController extends Controller
{
    /**
     * GET /api/v2/public/menu/{storeId}
     * Returns full catalog, active categories, and outlet info for the QR Menu.
     */
    public function menu(Request $request, string $storeId)
    {
        $activeTable = null;

        // Check if identifier is a Room QR Token
        $room = Room::where('qr_token', $storeId)->first();
        if ($room) {
            $tenant = Tenant::find($room->tenant_id);
            $activeTable = [
                'id' => $room->id,
                'name' => $room->name,
                'type' => $room->type,
                'is_locked' => true,
            ];
        } else {
            $tenant = Tenant::where('store_id', $storeId)
                ->orWhere('id', $storeId)
                ->first();
        }

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak ditemukan atau belum terdaftar.',
            ], 404);
        }

        $categories = Category::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get(['id', 'name', 'type', 'icon']);

        $products = Product::with(['category:id,name,type', 'variants' => function ($q) {
                $q->where('is_active', true);
            }])
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->where('is_available_online', true)
            ->orderByDesc('is_best_seller')
            ->orderBy('name')
            ->get();

        $tables = Room::where('tenant_id', $tenant->id)
            ->get(['id', 'name', 'type', 'status', 'qr_token']);

        $response = [
            'success' => true,
            'data' => [
                'tenant' => [
                    'id' => $tenant->id,
                    'store_id' => $tenant->store_id,
                    'business_name' => $tenant->business_name,
                    'business_address' => $tenant->business_address,
                    'phone' => $tenant->phone ?? '',
                    'logo_url' => $tenant->logo ?? null,
                    'is_qris_enabled' => (bool) $tenant->is_qris_approved,
                ],
                'active_table' => $activeTable,
                'categories' => $categories,
                'products' => $products->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'name' => $p->name,
                        'description' => $p->description ?? '',
                        'price' => (float) $p->price,
                        'stock' => (int) $p->stock,
                        'category_id' => $p->category_id,
                        'category_name' => $p->category ? $p->category->name : 'Umum',
                        'image_url' => $p->image_url,
                        'is_best_seller' => (bool) $p->is_best_seller,
                        'variants' => $p->variants->map(function ($v) {
                            return [
                                'id' => $v->id,
                                'name' => $v->name,
                                'additional_price' => (float) $v->additional_price,
                                'stock' => (int) $v->stock,
                            ];
                        }),
                    ];
                }),
                'tables' => $tables,
            ]
        ];

        return response()->json($response)
            ->header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    }

    /**
     * POST /api/v2/public/order/{storeId}
     * Places a customer order and generates DOKU Payment Gateway invoice if online.
     */
    public function checkout(Request $request, string $storeId)
    {
        $forcedTable = null;
        $room = Room::where('qr_token', $storeId)->first();
        if ($room) {
            $tenant = Tenant::find($room->tenant_id);
            $forcedTable = $room->name;
        } else {
            $tenant = Tenant::where('store_id', $storeId)
                ->orWhere('id', $storeId)
                ->first();
        }

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Outlet tidak valid.',
            ], 404);
        }

        $validated = $request->validate([
            'customer_name'  => 'required|string|max:100',
            'customer_phone' => 'nullable|string|max:30',
            'table_number'   => 'nullable|string|max:50',
            'order_type'     => 'required|in:DINE_IN,TAKEAWAY',
            'payment_method' => 'required|in:GATEWAY_QRIS,GATEWAY_VA_BCA,GATEWAY_VA_BRI,GATEWAY_VA_MANDIRI,CASHIER',
            'notes'          => 'nullable|string|max:500',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.quantity'   => 'required|integer|min:1|max:100',
            'items.*.notes'      => 'nullable|string|max:255',
        ]);

        $isGateway = str_starts_with($validated['payment_method'], 'GATEWAY_');
        if ($isGateway && !$tenant->is_qris_approved) {
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran QRIS online belum aktif pada gerai ini. Silakan pilih opsi Bayar di Kasir.',
            ], 403);
        }

        DB::beginTransaction();
        try {
            $receiptNumber = 'ONL-' . date('ymd') . '-' . strtoupper(Str::random(5));

            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $it) {
                $product = Product::with('recipeItems.rawMaterial')
                    ->where('tenant_id', $tenant->id)
                    ->where('id', $it['product_id'])
                    ->first();

                if (!$product) {
                    throw new \Exception("Produk ID {$it['product_id']} tidak ditemukan.");
                }

                $variant = null;
                $variantExtraPrice = 0;
                $variantName = '';

                if (!empty($it['variant_id'])) {
                    $variant = ProductVariant::where('product_id', $product->id)
                        ->where('id', $it['variant_id'])
                        ->first();
                    if ($variant) {
                        $variantExtraPrice = (float) $variant->additional_price;
                        $variantName = ' (' . $variant->name . ')';
                    }
                }

                $unitPrice = (float) $product->price + $variantExtraPrice;
                $itemSubtotal = $unitPrice * $it['quantity'];
                $subtotal += $itemSubtotal;

                $itemsData[] = [
                    'product' => $product,
                    'variant' => $variant,
                    'product_name' => $product->name . $variantName,
                    'quantity' => $it['quantity'],
                    'unit_price' => $unitPrice,
                    'subtotal' => $itemSubtotal,
                    'notes' => $it['notes'] ?? null,
                ];
            }

            $totalAmount = $subtotal;

            $transaction = Transaction::create([
                'receipt_number' => $receiptNumber,
                'tenant_id'      => $tenant->id,
                'cashier_id'     => null,
                'subtotal'       => $subtotal,
                'discount_amount'=> 0,
                'tax_amount'     => 0,
                'total_amount'   => $totalAmount,
                'amount_paid'    => 0,
                'change_amount'  => 0,
                'payment_method' => $isGateway ? strtolower(str_replace('GATEWAY_', '', $validated['payment_method'])) : 'cash',
                'status'         => 'pending',
                'payment_status' => 'UNPAID',
                'notes'          => $validated['notes'] ?? null,
                'customer_name'  => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'] ?? '-',
                'table_number'   => $forcedTable ?: ($validated['table_number'] ?? ($validated['order_type'] === 'TAKEAWAY' ? 'Takeaway' : 'Meja -')),
                'order_type'     => $validated['order_type'],
                'transacted_at'  => now(),
            ]);

            foreach ($itemsData as $itData) {
                TransactionItem::create([
                    'transaction_id'     => $transaction->id,
                    'product_id'         => $itData['product']->id,
                    'product_variant_id' => $itData['variant'] ? $itData['variant']->id : null,
                    'product_name'       => $itData['product_name'],
                    'quantity'           => $itData['quantity'],
                    'unit_price'         => $itData['unit_price'],
                    'subtotal'           => $itData['subtotal'],
                    'notes'              => $itData['notes'],
                ]);
            }

            // Generate DOKU Payment if gateway chosen
            $paymentInfo = null;
            if ($isGateway) {
                $dokuService = app(\App\Services\Payment\DokuPaymentService::class);
                if ($validated['payment_method'] === 'GATEWAY_QRIS') {
                    $paymentTx = $dokuService->requestDirectQris($transaction);
                    $paymentInfo = [
                        'invoice_number'   => $paymentTx->invoice_number,
                        'integration_type' => $paymentTx->integration_type,
                        'payment_channel'  => $paymentTx->payment_method,
                        'qr_content'       => $paymentTx->qris_string,
                        'qris_string'      => $paymentTx->qris_string,
                        'gross_amount'     => (float) $paymentTx->gross_amount,
                        'expired_at'       => $paymentTx->expired_at?->toIso8601String(),
                        'status'           => $paymentTx->status,
                    ];
                } else {
                    // DOKU Checkout for multi-channel self-ordering
                    $paymentTx = $dokuService->requestCheckoutPayment($transaction);
                    $paymentInfo = [
                        'invoice_number'   => $paymentTx->invoice_number,
                        'integration_type' => $paymentTx->integration_type,
                        'payment_channel'  => $paymentTx->payment_method,
                        'payment_url'      => $paymentTx->doku_payment_url,
                        'gross_amount'     => (float) $paymentTx->gross_amount,
                        'expired_at'       => $paymentTx->expired_at?->toIso8601String(),
                        'status'           => $paymentTx->status,
                    ];
                }
            } else {
                // If CASHIER, send Firebase alert right away
                FirebaseNotificationService::sendOrderSignal(
                    $tenant->store_id,
                    $transaction->status,
                    $transaction->id
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'receipt_number' => $receiptNumber,
                    'total_amount'   => $totalAmount,
                    'status'         => $transaction->status,
                    'payment_status' => $transaction->payment_status,
                    'payment_method' => $transaction->payment_method,
                    'table_number'   => $transaction->table_number,
                    'customer_name'  => $transaction->customer_name,
                    'created_at'     => $transaction->transacted_at->toIso8601String(),
                    'payment'        => $paymentInfo,
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses pesanan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v2/public/order/{storeId}/{receiptNumber}/payment-status
     * Returns real-time payment status for customer polling.
     */
    public function paymentStatus(Request $request, string $storeId, string $receiptNumber)
    {
        $tenant = Tenant::where('store_id', $storeId)
            ->orWhere('id', $storeId)
            ->first();

        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'Outlet tidak ditemukan.'], 404);
        }

        $transaction = Transaction::with('latestPaymentTransaction')
            ->where('tenant_id', $tenant->id)
            ->where('receipt_number', $receiptNumber)
            ->first();

        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        $paymentTx = $transaction->latestPaymentTransaction;

        return response()->json([
            'success' => true,
            'data' => [
                'receipt_number' => $transaction->receipt_number,
                'payment_status' => $transaction->payment_status,
                'order_status'   => $transaction->status,
                'payment_method' => $transaction->payment_method,
                'total_amount'   => (float) $transaction->total_amount,
                'payment_transaction' => $paymentTx ? [
                    'invoice_number'   => $paymentTx->invoice_number,
                    'integration_type' => $paymentTx->integration_type,
                    'payment_method'   => $paymentTx->payment_method,
                    'payment_url'      => $paymentTx->doku_payment_url,
                    'qris_string'      => $paymentTx->qris_string,
                    'status'           => $paymentTx->status,
                    'paid_at'          => $paymentTx->paid_at?->toIso8601String(),
                    'expired_at'       => $paymentTx->expired_at?->toIso8601String(),
                ] : null,
            ]
        ]);
    }

    /**
     * GET /api/v2/public/order/{storeId}/{receiptNumber}
     * Returns live order tracking details for customer.
     */
    public function status(Request $request, string $storeId, string $receiptNumber)
    {
        $tenant = Tenant::where('store_id', $storeId)
            ->orWhere('id', $storeId)
            ->first();

        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'Outlet tidak ditemukan'], 404);
        }

        $transaction = Transaction::with(['items.product.category'])
            ->where('tenant_id', $tenant->id)
            ->where('receipt_number', $receiptNumber)
            ->first();

        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'receipt_number' => $transaction->receipt_number,
                'status'         => $transaction->status,
                'payment_status' => $transaction->payment_status,
                'customer_name'  => $transaction->customer_name,
                'table_number'   => $transaction->table_number,
                'order_type'     => $transaction->order_type,
                'total_amount'   => (float) $transaction->total_amount,
                'created_at'     => $transaction->transacted_at,
                'items'          => $transaction->items->map(function ($it) {
                    return [
                        'name' => $it->product_name,
                        'quantity' => (int) $it->quantity,
                        'unit_price' => (float) $it->unit_price,
                        'subtotal' => (float) $it->subtotal,
                        'notes' => $it->notes,
                    ];
                }),
            ]
        ]);
    }
}
