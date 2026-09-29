<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Room;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PublicOrderController extends Controller
{
    /**
     * Tampilan Menu Pesan Online Publik (Guest QR Menu).
     */
    public function show(Request $request, string $storeId)
    {
        $tenant = Tenant::where('store_id', $storeId)
            ->orWhere('id', $storeId)
            ->firstOrFail();

        $categories = Category::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get(['id', 'name', 'type', 'icon']);

        $products = Product::with('category:id,name,type', 'variants')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->where('is_available_online', true)
            ->orderByDesc('is_best_seller')
            ->orderBy('name')
            ->get();

        $tables = Room::where('tenant_id', $tenant->id)
            ->get(['id', 'name', 'type', 'status']);

        $tableQuery = $request->query('table') ?? $request->query('meja') ?? '';

        return Inertia::render('Order/Index', [
            'tenant' => [
                'id' => $tenant->id,
                'store_id' => $tenant->store_id,
                'business_name' => $tenant->business_name,
                'business_address' => $tenant->business_address,
            ],
            'categories' => $categories,
            'products' => $products,
            'tables' => $tables,
            'initialTable' => $tableQuery,
        ]);
    }

    /**
     * Proses Checkout Pesanan Online (Gateway vs Bayar di Kasir).
     */
    public function checkout(Request $request, string $storeId)
    {
        $tenant = Tenant::where('store_id', $storeId)
            ->orWhere('id', $storeId)
            ->firstOrFail();

        $validated = $request->validate([
            'customer_name'  => 'required|string|max:100',
            'customer_phone' => 'required|string|max:30',
            'table_number'   => 'nullable|string|max:50',
            'order_type'     => 'required|in:DINE_IN,TAKEAWAY',
            'payment_method' => 'required|in:GATEWAY_QRIS,CASHIER',
            'notes'          => 'nullable|string|max:500',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.notes'      => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $isPaidOnline = $validated['payment_method'] === 'GATEWAY_QRIS';
            $receiptNumber = 'ONL-' . date('ymd') . '-' . strtoupper(Str::random(5));

            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $it) {
                $product = Product::with('recipeItems.rawMaterial')
                    ->where('tenant_id', $tenant->id)
                    ->where('id', $it['product_id'])
                    ->firstOrFail();

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
                'amount_paid'    => $isPaidOnline ? $totalAmount : 0,
                'change_amount'  => 0,
                'payment_method' => $isPaidOnline ? 'qris' : 'cash',
                'status'         => $isPaidOnline ? 'completed' : 'pending',
                'payment_status' => $isPaidOnline ? 'PAID' : 'UNPAID',
                'notes'          => $validated['notes'] ?? null,
                'customer_name'  => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'table_number'   => $validated['table_number'] ?? ($validated['order_type'] === 'TAKEAWAY' ? 'Takeaway' : 'Meja -'),
                'order_type'     => $validated['order_type'],
                'transacted_at'  => now(),
            ]);

            foreach ($itemsData as $itData) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id'     => $itData['product']->id,
                    'product_name'   => $itData['product_name'],
                    'quantity'       => $itData['quantity'],
                    'unit_price'     => $itData['unit_price'],
                    'subtotal'       => $itData['subtotal'],
                    'notes'          => $itData['notes'],
                ]);

                // Kurangi stok jika lunas online
                if ($isPaidOnline) {
                    $prod = $itData['product'];
                    if ($prod->recipeItems->isNotEmpty()) {
                        foreach ($prod->recipeItems as $recipe) {
                            if ($recipe->rawMaterial) {
                                $recipe->rawMaterial->decrement('stock', $recipe->quantity * $itData['quantity']);
                            }
                        }
                    } else {
                        $prod->decrement('stock', $itData['quantity']);
                    }

                    if ($itData['variant']) {
                        $itData['variant']->decrement('stock', $itData['quantity']);
                    }
                }
            }

            DB::commit();

            // Kirim sinyal notifikasi ultra-minimalis ke kasir outlet terkait
            \App\Services\FirebaseNotificationService::sendOrderSignal(
                $tenant->store_id,
                $transaction->status,
                $transaction->id
            );

            return redirect()->route('order.status', [
                'storeId' => $tenant->store_id,
                'receiptNumber' => $receiptNumber
            ])->with('success', 'Pesanan online berhasil dibuat!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal membuat pesanan: ' . $e->getMessage()]);
        }
    }

    /**
     * Halaman Live Tracker & Struk Pesanan Online.
     */
    public function track(Request $request, string $storeId, string $receiptNumber)
    {
        $tenant = Tenant::where('store_id', $storeId)
            ->orWhere('id', $storeId)
            ->firstOrFail();

        $transaction = Transaction::with(['items.product.category'])
            ->where('tenant_id', $tenant->id)
            ->where('receipt_number', $receiptNumber)
            ->firstOrFail();

        return Inertia::render('Order/Status', [
            'tenant' => [
                'id' => $tenant->id,
                'store_id' => $tenant->store_id,
                'business_name' => $tenant->business_name,
                'business_address' => $tenant->business_address,
            ],
            'transaction' => $transaction,
        ]);
    }
}
