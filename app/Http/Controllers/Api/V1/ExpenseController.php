<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * GET /api/v1/expenses
     * Get all expenses for tenant.
     */
    public function index()
    {
        $tenant = app('tenant');
        $expenses = Expense::where('tenant_id', $tenant->id)->get();
        return response()->json($expenses);
    }

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

    /**
     * DELETE /api/v1/expenses/{id}
     * Delete expense
     */
    public function destroy($id)
    {
        $tenant = app('tenant');
        $expense = Expense::where('tenant_id', $tenant->id)->findOrFail($id);
        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully']);
    }
}
