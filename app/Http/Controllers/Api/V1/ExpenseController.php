<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * POST /api/v1/expenses
     * Store new expense from mobile app.
     */
    public function store(Request $request)
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'name'         => 'required|string',
            'category'     => 'required|string',
            'amount'       => 'required|numeric|min:0',
            'description'  => 'nullable|string',
            'expense_date' => 'required|date',
        ]);

        $expense = Expense::create([
            'tenant_id'    => $tenant->id,
            'name'         => $validated['name'],
            'category'     => $validated['category'],
            'amount'       => $validated['amount'],
            'description'  => $validated['description'] ?? null,
            'expense_date' => $validated['expense_date'],
        ]);

        return response()->json([
            'message' => 'Expense created successfully',
            'data'    => $expense
        ], 201);
    }
}
