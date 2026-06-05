<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $expenses = Expense::where('tenant_id', $tenant->id)
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            })
            ->when($request->month, function ($q, $month) {
                $q->whereMonth('expense_date', date('m', strtotime($month)))
                  ->whereYear('expense_date', date('Y', strtotime($month)));
            })
            ->orderByDesc('expense_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Owner/Expenses/Index', [
            'expenses' => $expenses,
            'filters' => $request->only('search', 'month'),
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'description' => 'nullable|string',
        ]);
        
        Expense::create([
            ...$validated,
            'tenant_id' => $tenant->id,
        ]);

        return back()->with('success', 'Pengeluaran berhasil ditambahkan.');
    }

    public function update(Request $request, Expense $expense)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($expense->tenant_id === $tenant->id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $expense->update($validated);

        return back()->with('success', 'Pengeluaran berhasil diperbarui.');
    }

    public function destroy(Request $request, Expense $expense)
    {
        $tenant = $request->user()->tenants()->first() ?? abort(403);
        abort_unless($expense->tenant_id === $tenant->id, 403);

        $expense->delete();

        return back()->with('success', 'Pengeluaran berhasil dihapus.');
    }
}
