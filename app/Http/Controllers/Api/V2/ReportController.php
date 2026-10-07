<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * GET /api/v2/reports/daily
     */
    public function daily(Request $request)
    {
        $tenant = app('tenant');
        $date = $request->input('date', Carbon::today()->toDateString());

        $transactions = Transaction::where('tenant_id', $tenant->id)
            ->whereDate('transacted_at', $date)
            ->get();

        $totalRevenue = $transactions->sum('total_amount');
        $totalTransactions = $transactions->count();

        $paymentBreakdown = $transactions->groupBy('payment_method')->map(function ($group) {
            return [
                'count' => $group->count(),
                'total' => $group->sum('total_amount'),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => [
                'date'               => $date,
                'total_revenue'      => (float) $totalRevenue,
                'total_transactions' => $totalTransactions,
                'payment_breakdown'  => $paymentBreakdown,
            ],
        ]);
    }

    /**
     * GET /api/v2/reports/top-products
     */
    public function topProducts(Request $request)
    {
        $tenant = app('tenant');
        $limit = (int) $request->input('limit', 5);

        $topItems = TransactionItem::whereHas('transaction', function ($query) use ($tenant) {
            $query->where('tenant_id', $tenant->id);
        })
        ->selectRaw('product_name, SUM(quantity) as total_sold, SUM(subtotal) as total_sales')
        ->groupBy('product_name')
        ->orderByDesc('total_sold')
        ->limit($limit)
        ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $topItems,
        ]);
    }
}
