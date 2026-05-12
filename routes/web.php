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

        // --- Modul 4: Rooms (PS/Rental) ---
        Route::resource('rooms', \App\Http\Controllers\Owner\RoomController::class)->except(['create', 'show', 'edit']);
        Route::get('rooms/{room}/sessions', [\App\Http\Controllers\Owner\RoomController::class, 'sessions'])->name('rooms.sessions');

        // --- Modul 4: Employees ---
        Route::get('/employees', [\App\Http\Controllers\Owner\EmployeeController::class, 'index'])->name('employees.index');
        Route::post('/employees', [\App\Http\Controllers\Owner\EmployeeController::class, 'store'])->name('employees.store');
        Route::put('/employees/{employee}', [\App\Http\Controllers\Owner\EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{employee}', [\App\Http\Controllers\Owner\EmployeeController::class, 'destroy'])->name('employees.destroy');

        // --- Modul 4: Reports ---
        Route::get('/reports', [\App\Http\Controllers\Owner\ReportController::class, 'index'])->name('reports.index');

        // Inventory & RnD (BOM)
        Route::resource('raw-materials', \App\Http\Controllers\Owner\RawMaterialController::class)->except(['create', 'show', 'edit']);
        Route::get('recipes', [\App\Http\Controllers\Owner\RecipeController::class, 'index'])->name('recipes.index');
        Route::put('recipes/{product}', [\App\Http\Controllers\Owner\RecipeController::class, 'update'])->name('recipes.update');

        // Manajemen Outlet / Toko (Multi-tenant dengan limit paket)
        Route::get('outlets', [\App\Http\Controllers\Owner\OutletController::class, 'index'])->name('outlets.index');
        Route::post('outlets', [\App\Http\Controllers\Owner\OutletController::class, 'store'])->name('outlets.store');
        Route::put('outlets/{tenant}', [\App\Http\Controllers\Owner\OutletController::class, 'update'])->name('outlets.update');
        Route::delete('outlets/{tenant}', [\App\Http\Controllers\Owner\OutletController::class, 'destroy'])->name('outlets.destroy');
    });
});

require __DIR__.'/settings.php';
