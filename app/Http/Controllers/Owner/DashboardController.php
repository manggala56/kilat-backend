<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\Product;
use App\Models\Employee;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first();

        // If no tenant, return empty dashboard
        if (!$tenant) {
            return Inertia::render('dashboard', [
                'stats' => [
                    'sales_today' => 0,
                    'orders_today' => 0,
                    'active_staff' => 0,
                    'low_stock' => 0,
                ],
                'recent_transactions' => [],
                'top_products' => [],
            ]);
        }

        // Sales Today
        $salesToday = Transaction::where('tenant_id', $tenant->id)
            ->whereDate('created_at', Carbon::today())
            ->where('status', 'completed')
            ->sum('total_amount');

        // Orders Today
        $ordersToday = Transaction::where('tenant_id', $tenant->id)
            ->whereDate('created_at', Carbon::today())
            ->count();

        // Active Staff
        $activeStaff = Employee::where('tenant_id', $tenant->id)->where('is_active', true)->count();
        $totalStaff = Employee::where('tenant_id', $tenant->id)->count();

        // Low Stock Products
        $lowStock = Product::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->count();

        // Recent Transactions
        $recentTransactions = Transaction::where('tenant_id', $tenant->id)
            ->with('cashier')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->receipt_number,
                    'name' => $t->cashier ? $t->cashier->name : 'System',
                    'total' => 'Rp ' . number_format($t->total_amount, 0, ',', '.'),
                    'status' => ucfirst($t->status)
                ];
            });

        // Top Sales (Dummy logic for now based on dummy transactions, ideally from transaction_items)
        // Since we don't have transaction items queried yet, we'll return an empty list or basic data
        $topProducts = []; // TODO: implement real top products query

        return Inertia::render('dashboard', [
            'stats' => [
                'sales_today' => 'Rp ' . number_format($salesToday, 0, ',', '.'),
                'orders_today' => $ordersToday,
                'active_staff' => $activeStaff . '/' . max($totalStaff, 1),
                'low_stock' => str_pad($lowStock, 2, '0', STR_PAD_LEFT),
            ],
            'recent_transactions' => $recentTransactions,
            'top_products' => $topProducts,
        ]);
    }
}
