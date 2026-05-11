<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // --- Owner Portal: Modul 2 ---
    Route::prefix('owner')->name('owner.')->group(function () {
        // Products CRUD
        Route::get('/products', [\App\Http\Controllers\Owner\ProductController::class, 'index'])->name('products.index');
        Route::post('/products', [\App\Http\Controllers\Owner\ProductController::class, 'store'])->name('products.store');
        Route::put('/products/{product}', [\App\Http\Controllers\Owner\ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [\App\Http\Controllers\Owner\ProductController::class, 'destroy'])->name('products.destroy');

        // Categories CRUD
        Route::get('/categories', [\App\Http\Controllers\Owner\CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [\App\Http\Controllers\Owner\CategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}', [\App\Http\Controllers\Owner\CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [\App\Http\Controllers\Owner\CategoryController::class, 'destroy'])->name('categories.destroy');

        // Inventory Tracker & Stock Opname
        Route::get('/inventory', [\App\Http\Controllers\Owner\InventoryController::class, 'index'])->name('inventory.index');
        Route::post('/inventory/adjust', [\App\Http\Controllers\Owner\InventoryController::class, 'adjust'])->name('inventory.adjust');

        // Transaction History
        Route::get('/transactions', [\App\Http\Controllers\Owner\TransactionController::class, 'index'])->name('transactions.index');
        Route::get('/transactions/{transaction}', [\App\Http\Controllers\Owner\TransactionController::class, 'show'])->name('transactions.show');
    });
});

require __DIR__.'/settings.php';
