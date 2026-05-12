<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * GET /api/v1/reports/daily
     * Statistik penjualan harian.
     * Query param: ?date=YYYY-MM-DD (default: hari ini)
     */
    public function daily(Request $request)
    {
        $tenant = app('tenant');
        $date   = $request->query('date', now()->toDateString());

        $result = Transaction::where('tenant_id', $tenant->id)
            ->where('status', 'completed')
            ->whereDate('transacted_at', $date)
            ->selectRaw('SUM(total_amount) as total_sales, COUNT(*) as transaction_count')
            ->first();

        return response()->json([
            'data' => [
                'total_sales'       => (float) ($result->total_sales ?? 0),
                'transaction_count' => (int) ($result->transaction_count ?? 0),
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/top-products
     * Produk terlaris berdasarkan tanggal.
     * Query params: ?limit=5&date=YYYY-MM-DD
     */
    public function topProducts(Request $request)
    {
        $tenant = app('tenant');
        $limit  = (int) $request->query('limit', 5);
        $date   = $request->query('date', now()->toDateString());

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
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'name'     => $row->name,
                'quantity' => (int) $row->quantity,
                'total'    => (float) $row->total,
            ]);

        return response()->json(['data' => $topProducts]);
    }
}
