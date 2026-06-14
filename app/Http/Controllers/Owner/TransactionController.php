<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionController extends Controller
{
    /**
     * Transaction History Viewer — all receipts with filters.
     */
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant ?? abort(403);

        $transactions = Transaction::with([
                'cashier:id,name',
                'items:id,transaction_id,product_name,quantity,unit_price,subtotal',
            ])
            ->where('tenant_id', $tenant->id)
            ->when($request->search, fn ($q) =>
                $q->where('receipt_number', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) =>
                $q->where('status', $request->status))
            ->when($request->payment_method, fn ($q) =>
                $q->where('payment_method', $request->payment_method))
            ->when($request->date_from, fn ($q) =>
                $q->whereDate('transacted_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) =>
                $q->whereDate('transacted_at', '<=', $request->date_to))
            ->orderByDesc('transacted_at')
            ->paginate(25)
            ->withQueryString();

        // Summary stats for the current filter
        $statsQuery = Transaction::where('tenant_id', $tenant->id)
            ->when($request->date_from, fn ($q) => $q->whereDate('transacted_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('transacted_at', '<=', $request->date_to))
            ->where('status', 'completed');

        $stats = [
            'total_revenue' => $statsQuery->sum('total_amount'),
            'total_transactions' => $statsQuery->count(),
            'average_basket' => $statsQuery->avg('total_amount'),
        ];

        // Chart Data: Daily Revenue
        $chartData = Transaction::where('tenant_id', $tenant->id)
            ->where('status', 'completed')
            ->when($request->date_from, fn ($q) => $q->whereDate('transacted_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('transacted_at', '<=', $request->date_to))
            ->select(DB::raw('DATE(transacted_at) as date'), DB::raw('SUM(total_amount) as total'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Pie Chart Data: Payment Methods
        $paymentMethodsData = Transaction::where('tenant_id', $tenant->id)
            ->where('status', 'completed')
            ->when($request->date_from, fn ($q) => $q->whereDate('transacted_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('transacted_at', '<=', $request->date_to))
            ->select('payment_method', DB::raw('count(*) as count'), DB::raw('SUM(total_amount) as total'))
            ->groupBy('payment_method')
            ->get();

        return Inertia::render('Owner/Transactions/Index', [
            'transactions' => $transactions,
            'stats' => $stats,
            'chartData' => $chartData,
            'paymentMethodsData' => $paymentMethodsData,
            'filters' => $request->only('search', 'status', 'payment_method', 'date_from', 'date_to'),
        ]);
    }

    /**
     * Show a single transaction receipt detail.
     */
    public function show(Request $request, Transaction $transaction)
    {
        $tenant = $request->user()->tenant ?? abort(403);
        abort_unless($transaction->tenant_id === $tenant->id, 403);

        $transaction->load('cashier:id,name', 'items.product:id,name,image');

        return Inertia::render('Owner/Transactions/Show', [
            'transaction' => $transaction,
        ]);
    }
}
