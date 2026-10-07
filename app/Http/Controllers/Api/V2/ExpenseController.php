<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * GET /api/v2/expenses
     */
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $expenses = Expense::where('tenant_id', $tenant->id)
            ->latest('expense_date')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $expenses,
        ]);
    }

    /**
     * POST /api/v2/expenses
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'name'         => 'required|string',
            'category'     => 'nullable|string',
            'amount'       => 'required|numeric|min:0',
            'description'  => 'nullable|string',
            'expense_date' => 'required|date',
        ]);

        $expense = Expense::create([
            'tenant_id'    => $tenant->id,
            'name'         => $validated['name'],
            'category'     => $validated['category'] ?? 'Operational',
            'amount'       => $validated['amount'],
            'description'  => $validated['description'] ?? null,
            'expense_date' => $validated['expense_date'],
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengeluaran berhasil dicatat.',
            'data'    => $expense,
        ], 201);
    }
}
