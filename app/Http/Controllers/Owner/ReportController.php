<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Halaman laporan utama Owner — statistik harian + top produk.
     */
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        $date   = $request->query('date', now()->toDateString());

        // Statistik harian
        $dailyStats = Transaction::where('tenant_id', $tenant->id)
            ->where('status', 'completed')
            ->whereDate('transacted_at', $date)
            ->selectRaw('SUM(total_amount) as total_sales, COUNT(*) as transaction_count')
            ->first();

        // Hitung Pendapatan Sewa Ruangan (ROOM) vs F&B (FOOD, DRINK, OTHER)
        $roomSales = DB::table('transaction_items as ti')
            ->join('transactions as t', 't.id', '=', 'ti.transaction_id')
            ->join('products as p', 'p.id', '=', 'ti.product_id')
            ->join('categories as c', 'c.id', '=', 'p.category_id')
            ->where('t.tenant_id', $tenant->id)
            ->where('t.status', 'completed')
            ->whereDate('t.transacted_at', $date)
            ->where('c.type', 'ROOM')
            ->sum('ti.subtotal');

        $totalSalesVal = (float) ($dailyStats->total_sales ?? 0);
        $fnbSales = $totalSalesVal - (float) $roomSales;

        // Hitung Total HPP (COGS) dari produk yang terjual hari ini
        $totalCogs = DB::table('transaction_items as ti')
            ->join('transactions as t', 't.id', '=', 'ti.transaction_id')
            ->where('t.tenant_id', $tenant->id)
            ->where('t.status', 'completed')
            ->whereDate('t.transacted_at', $date)
            ->sum(DB::raw('ti.quantity * ti.hpp_snapshot')); 

        $grossProfit = $totalSalesVal - $totalCogs;

        // Hitung Pengeluaran harian
        $dailyExpenses = \App\Models\Expense::where('tenant_id', $tenant->id)
            ->whereDate('expense_date', $date)
            ->sum('amount');

        // Hitung Payroll harian
        $dailyPayrolls = \App\Models\Payroll::where('tenant_id', $tenant->id)
            ->where('status', 'paid')
            ->whereDate('updated_at', $date)
            ->sum('net_salary');

        $netProfit = $grossProfit - $dailyExpenses - $dailyPayrolls;

        // ── CASH FLOW (ARUS KAS) ──
        // Inflows (Penjualan kotor per metode pembayaran)
        $inflows = DB::table('transactions')
            ->where('tenant_id', $tenant->id)
            ->where('status', 'completed')
            ->whereDate('transacted_at', $date)
            ->selectRaw('payment_method, SUM(total_amount) as total')
            ->groupBy('payment_method')
            ->get()
            ->pluck('total', 'payment_method')
            ->toArray();
        
        $cashInflow = (float) ($inflows['cash'] ?? 0);
        $qrisInflow = (float) ($inflows['qris'] ?? 0);
        $debitInflow = (float) ($inflows['debit'] ?? 0);

        // Lists of daily outflows
        $expensesList = \App\Models\Expense::where('tenant_id', $tenant->id)
            ->whereDate('expense_date', $date)
            ->get();
        $payrollsList = \App\Models\Payroll::where('tenant_id', $tenant->id)
            ->where('status', 'paid')
            ->whereDate('updated_at', $date)
            ->with('employee:id,name')
            ->get();

        // ── BALANCE SHEET (NERACA) ──
        // Cash asset (All-time sales - All-time expenses - All-time payrolls)
        $allTimeSales = Transaction::where('tenant_id', $tenant->id)->where('status', 'completed')->whereDate('transacted_at', '<=', $date)->sum('total_amount');
        $allTimeExpenses = \App\Models\Expense::where('tenant_id', $tenant->id)->whereDate('expense_date', '<=', $date)->sum('amount');
        $allTimePayrolls = \App\Models\Payroll::where('tenant_id', $tenant->id)->where('status', 'paid')->whereDate('updated_at', '<=', $date)->sum('net_salary');
        
        $cashAsset = (float) $allTimeSales - (float) $allTimeExpenses - (float) $allTimePayrolls;
        
        // Inventory asset value (Products stock * price + Materials stock * cost_per_unit)
        $productInv = DB::table('products')->where('tenant_id', $tenant->id)->where('is_active', true)->sum(DB::raw('stock * price'));
        $materialInv = DB::table('raw_materials')->where('tenant_id', $tenant->id)->where('is_active', true)->sum(DB::raw('stock * cost_per_unit'));
        $inventoryAsset = (float) $productInv + (float) $materialInv;

        // Liabilities (Pending unpaid payrolls)
        $liabilities = \App\Models\Payroll::where('tenant_id', $tenant->id)->where('status', 'pending')->sum('net_salary');

        // Equity = Assets - Liabilities
        $equity = ($cashAsset + $inventoryAsset) - (float) $liabilities;

        // ── CATEGORY SALES BREAKDOWN ──
        $categoryBreakdown = DB::table('transaction_items as ti')
            ->join('transactions as t', 't.id', '=', 'ti.transaction_id')
            ->join('products as p', 'p.id', '=', 'ti.product_id')
            ->leftJoin('categories as c', 'c.id', '=', 'p.category_id')
            ->where('t.tenant_id', $tenant->id)
            ->where('t.status', 'completed')
            ->whereDate('t.transacted_at', $date)
            ->select(
                DB::raw('COALESCE(c.name, "Uncategorized") as category_name'),
                DB::raw('COALESCE(c.type, "OTHER") as category_type'),
                DB::raw('SUM(ti.quantity) as quantity'),
                DB::raw('SUM(ti.subtotal) as total')
            )
            ->groupBy('category_name', 'category_type')
            ->get();

        // Top 10 produk
        $topProducts = DB::table('transaction_items as ti')
            ->join('transactions as t', 't.id', '=', 'ti.transaction_id')
            ->join('products as p', 'p.id', '=', 'ti.product_id')
            ->where('t.tenant_id', $tenant->id)
            ->where('t.status', 'completed')
            ->whereDate('t.transacted_at', $date)
            ->select(
                'p.name',
                DB::raw('SUM(ti.quantity) as quantity'),
                DB::raw('SUM(ti.subtotal) as total')
            )
            ->groupBy('p.id', 'p.name')
            ->orderByDesc('quantity')
            ->limit(10)
            ->get();

        // Pendapatan 7 hari terakhir (chart)
        $weeklyRevenue = DB::table('transactions')
            ->where('tenant_id', $tenant->id)
            ->where('status', 'completed')
            ->where('transacted_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw("DATE(transacted_at) as date, SUM(total_amount) as revenue")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Owner/Reports/Index', [
            'date'          => $date,
            'dailyStats'    => [
                'total_sales'       => $totalSalesVal,
                'room_sales'        => (float) $roomSales,
                'fnb_sales'         => (float) $fnbSales,
                'transaction_count' => (int) ($dailyStats->transaction_count ?? 0),
                'gross_profit'      => (float) $grossProfit,
                'net_profit'        => (float) $netProfit,
                'total_expenses'    => (float) $dailyExpenses,
                'total_payrolls'    => (float) $dailyPayrolls,
                'total_cogs'        => (float) $totalCogs,
            ],
            'cashFlow'      => [
                'inflow_cash'       => $cashInflow,
                'inflow_qris'       => $qrisInflow,
                'inflow_debit'      => $debitInflow,
                'expenses_list'     => $expensesList,
                'payrolls_list'     => $payrollsList,
            ],
            'balanceSheet'  => [
                'cash_asset'        => $cashAsset,
                'inventory_asset'   => $inventoryAsset,
                'total_assets'      => $cashAsset + $inventoryAsset,
                'liabilities'       => (float) $liabilities,
                'equity'            => $equity,
            ],
            'categoryBreakdown' => $categoryBreakdown,
            'topProducts'   => $topProducts,
            'weeklyRevenue' => $weeklyRevenue,
        ]);
    }

    /**
     * Halaman daftar Sesi Kasir
     */
    public function sessions(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $sessions = \App\Models\CashierSession::with('cashier:id,name')
            ->where('tenant_id', $tenant->id)
            ->orderByDesc('clock_in_time')
            ->paginate(20);

        return Inertia::render('Owner/Reports/CashierSessions', [
            'sessions' => $sessions
        ]);
    }

    /**
     * Halaman detail satu Sesi Kasir (Invoice List)
     */
    public function sessionDetail(Request $request, $id)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);

        $session = \App\Models\CashierSession::with('cashier:id,name')
            ->where('tenant_id', $tenant->id)
            ->findOrFail($id);

        $transactions = Transaction::with('items.product')
            ->where('tenant_id', $tenant->id)
            ->where('cashier_session_id', $session->id)
            ->orderByDesc('transacted_at')
            ->get();

        return Inertia::render('Owner/Reports/SessionDetail', [
            'session' => $session,
            'transactions' => $transactions
        ]);
    }
}
