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
                'total_sales'       => (float) ($dailyStats->total_sales ?? 0),
                'transaction_count' => (int) ($dailyStats->transaction_count ?? 0),
            ],
            'topProducts'   => $topProducts,
            'weeklyRevenue' => $weeklyRevenue,
        ]);
    }
}
