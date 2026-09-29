<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

// Loose Rate Limiting: 1000 requests per minute per IP for POS Sync
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(1000)->by($request->ip());
});

// ─────────────────────────────────────────────────────────────
// API v1 — Kilatz Mobile (Modul 4)
// Base URL: {BASE_URL}/api/v1
// ─────────────────────────────────────────────────────────────
Route::prefix('v1')
    ->middleware(['throttle:api'])
    ->group(function () {

        // ── Ping ────────────────────────────────────────────
        Route::get('/ping', fn () => response()->json(['status' => 'ok', 'message' => 'API is running']));

        // ─────────────────────────────────────────────────────
        // 1. Authentication (tidak perlu Bearer Token)
        // ─────────────────────────────────────────────────────

        // #1  POST /v1/login  — Login employee (username + PIN + outlet_id)
        Route::post('/login', [\App\Http\Controllers\Api\V1\AuthController::class, 'login']);

        // #2  POST /v1/register  — Daftar employee baru
        Route::post('/register', [\App\Http\Controllers\Api\V1\AuthController::class, 'register']);

        // ── Online Orders Sync & Confirmation (POS Push-to-Pull) ──
        Route::get('/online-orders/stream',          [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'stream']);
        Route::get('/online-orders/pending',         [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'pending']);
        Route::get('/online-orders/{id}',            [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'show']);
        Route::post('/online-orders/{id}/confirm',   [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'confirm']);
        Route::post('/online-orders/{id}/complete',  [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'complete']);


        // ─────────────────────────────────────────────────────
        // Protected endpoints — Sanctum Bearer Token ✅
        // ─────────────────────────────────────────────────────
        Route::middleware(['auth:sanctum'])->group(function () {

            // #3  POST /v1/logout
            Route::post('/logout', [\App\Http\Controllers\Api\V1\AuthController::class, 'logout']);

            // Semua endpoint di bawah butuh Tenant Resolver
            Route::middleware(['tenant.resolver'])->group(function () {

                // ── Products ───────────────────────────────
                // #4  GET    /v1/products
                // #5  POST   /v1/products
                // #6  PUT    /v1/products/{id}
                // #7  DELETE /v1/products/{id}
                Route::get('/products',        [\App\Http\Controllers\Api\V1\ProductController::class, 'index']);
                Route::post('/products',       [\App\Http\Controllers\Api\V1\ProductController::class, 'store']);
                Route::put('/products/{id}',   [\App\Http\Controllers\Api\V1\ProductController::class, 'update']);
                Route::delete('/products/{id}',[\App\Http\Controllers\Api\V1\ProductController::class, 'destroy']);

                // ── Categories ─────────────────────────────
                // #8  GET    /v1/categories
                // #9  POST   /v1/categories
                // #10 PUT    /v1/categories/{id}
                // #11 DELETE /v1/categories/{id}
                Route::get('/categories',         [\App\Http\Controllers\Api\V1\CategoryController::class, 'index']);
                Route::post('/categories',        [\App\Http\Controllers\Api\V1\CategoryController::class, 'store']);
                Route::put('/categories/{id}',    [\App\Http\Controllers\Api\V1\CategoryController::class, 'update']);
                Route::delete('/categories/{id}', [\App\Http\Controllers\Api\V1\CategoryController::class, 'destroy']);

                // ── Materials & Recipes ────────────────────
                // GET /v1/materials
                // GET /v1/recipes
                Route::get('/materials', [\App\Http\Controllers\Api\V1\RawMaterialController::class, 'index']);
                Route::get('/recipes', [\App\Http\Controllers\Api\V1\RecipeController::class, 'index']);

                // ── Transactions ───────────────────────────
                // #12 POST /v1/transactions         — Checkout
                // #13 GET  /v1/transactions         — History
                // #14 GET  /v1/transactions/{id}/items — Detail items
                Route::post('/transactions',              [\App\Http\Controllers\Api\V1\TransactionController::class, 'store']);
                Route::post('/transactions/{invoice}/cancel-item', [\App\Http\Controllers\Api\V1\TransactionController::class, 'cancelItem']);
                Route::get('/transactions',               [\App\Http\Controllers\Api\V1\TransactionController::class, 'index']);
                Route::get('/transactions/{id}/items',    [\App\Http\Controllers\Api\V1\TransactionController::class, 'items']);

                // ── Online Orders Sync & Confirmation (POS) ──
                Route::get('/online-orders/pending',        [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'pending']);
                Route::get('/online-orders/{id}',           [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'show']);
                Route::post('/online-orders/{id}/confirm',  [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'confirm']);
                Route::post('/online-orders/{id}/complete', [\App\Http\Controllers\Api\V1\OnlineOrderSyncController::class, 'complete']);

                // Cashier Sessions & Drawer Logs
                Route::post('/cashier-sessions',          [\App\Http\Controllers\Api\V1\CashierSessionController::class, 'store']);
                Route::post('/cash-drawer-logs',          [\App\Http\Controllers\Api\V1\CashDrawerLogController::class, 'store']);

                // ── Rooms ──────────────────────────────────
                // #15 GET  /v1/rooms
                // #16 POST /v1/rooms/{id}/sessions/start
                // #17 POST /v1/rooms/{id}/sessions/{sid}/stop
                // #18 GET  /v1/rooms/{id}/sessions/active
                Route::get('/rooms',                                        [\App\Http\Controllers\Api\V1\RoomController::class, 'index']);
                Route::post('/rooms/{roomId}/sessions/start',               [\App\Http\Controllers\Api\V1\RoomController::class, 'startSession']);
                Route::post('/rooms/{roomId}/sessions/{sessionId}/stop',    [\App\Http\Controllers\Api\V1\RoomController::class, 'stopSession']);
                Route::get('/rooms/{roomId}/sessions/active',               [\App\Http\Controllers\Api\V1\RoomController::class, 'activeSession']);

                // ── Reports ────────────────────────────────
                // #19 GET /v1/reports/daily
                // #20 GET /v1/reports/top-products
                Route::get('/reports/daily',        [\App\Http\Controllers\Api\V1\ReportController::class, 'daily']);
                Route::get('/reports/top-products', [\App\Http\Controllers\Api\V1\ReportController::class, 'topProducts']);

                // ── Expenses & Restocks ────────────────────
                Route::get('/expenses', [\App\Http\Controllers\Api\V1\ExpenseController::class, 'index']);
                Route::post('/expenses', [\App\Http\Controllers\Api\V1\ExpenseController::class, 'store']);
                Route::delete('/expenses/{id}', [\App\Http\Controllers\Api\V1\ExpenseController::class, 'destroy']);
                Route::get('/restocks',  [\App\Http\Controllers\Api\V1\RestockController::class, 'index']);
                Route::post('/restocks', [\App\Http\Controllers\Api\V1\RestockController::class, 'store']);
                Route::delete('/restocks/{id}', [\App\Http\Controllers\Api\V1\RestockController::class, 'destroy']);

                // ── Employees ──────────────────────────────
                // #21 GET /v1/employees
                Route::get('/employees', [\App\Http\Controllers\Api\V1\EmployeeController::class, 'index']);

                // ── Attendance ─────────────────────────────
                // #22 POST /v1/attendance/clock-in
                // #23 POST /v1/attendance/clock-out
                Route::post('/attendance/clock-in', [\App\Http\Controllers\Api\V1\AttendanceController::class, 'clockIn']);
                Route::post('/attendance/clock-out', [\App\Http\Controllers\Api\V1\AttendanceController::class, 'clockOut']);

            }); // end tenant.resolver
        }); // end auth:sanctum
    }); // end v1

// ─────────────────────────────────────────────────────────────
// API v2 — Kilatz POS Modular (Device Pairing & Offline Cashier)
// Base URL: {BASE_URL}/api/v2
// ─────────────────────────────────────────────────────────────
Route::prefix('v2')
    ->middleware(['throttle:api'])
    ->group(function () {

        // ── Ping ────────────────────────────────────────────
        Route::get('/ping', fn () => response()->json(['status' => 'ok', 'version' => 'v2', 'message' => 'API v2 is running']));

        // ─────────────────────────────────────────────────────
        // 1. Device Activation / Owner Pairing (No Token Required)
        // ─────────────────────────────────────────────────────
        Route::post('/device/verify-owner', [\App\Http\Controllers\Api\V2\DeviceAuthController::class, 'verifyOwner']);
        Route::post('/device/activate',     [\App\Http\Controllers\Api\V2\DeviceAuthController::class, 'activate']);

        // ─────────────────────────────────────────────────────
        // 2. Protected by Device Sanctum Token & Tenant Resolver
        // ─────────────────────────────────────────────────────
        Route::middleware(['auth:sanctum', 'tenant.resolver'])->group(function () {

            // ── Device & Staff Management ────────────────────
            Route::get('/device/info',        [\App\Http\Controllers\Api\V2\DeviceAuthController::class, 'info']);
            Route::get('/device/staff',       [\App\Http\Controllers\Api\V2\DeviceAuthController::class, 'syncStaff']);
            Route::post('/device/deactivate', [\App\Http\Controllers\Api\V2\DeviceAuthController::class, 'deactivate']);
            Route::post('/cashier/login',     [\App\Http\Controllers\Api\V2\DeviceAuthController::class, 'cashierLogin']);

            // ── Cashier Shift / Tutup Kasir Sync ─────────────
            Route::post('/cashier-sessions',   [\App\Http\Controllers\Api\V2\CashierSessionController::class, 'store']);
            Route::post('/cash-drawer-logs',   [\App\Http\Controllers\Api\V2\CashDrawerLogController::class, 'store']);
            Route::post('/attendance/clock-in',  [\App\Http\Controllers\Api\V2\AttendanceController::class, 'clockIn']);
            Route::post('/attendance/clock-out', [\App\Http\Controllers\Api\V2\AttendanceController::class, 'clockOut']);

            // ── Transactions ─────────────────────────────────
            Route::post('/transactions',                      [\App\Http\Controllers\Api\V2\TransactionController::class, 'store']);
            Route::get('/transactions',                       [\App\Http\Controllers\Api\V2\TransactionController::class, 'index']);
            Route::post('/transactions/{invoice}/cancel-item', [\App\Http\Controllers\Api\V2\TransactionController::class, 'cancelItem']);

            // ── Master Data & Catalog ────────────────────────
            Route::get('/products',   [\App\Http\Controllers\Api\V2\ProductController::class, 'index']);
            Route::post('/products',  [\App\Http\Controllers\Api\V2\ProductController::class, 'store']);
            Route::get('/categories', [\App\Http\Controllers\Api\V2\CategoryController::class, 'index']);
            Route::post('/categories',[\App\Http\Controllers\Api\V2\CategoryController::class, 'store']);
            Route::get('/materials',  [\App\Http\Controllers\Api\V2\RawMaterialController::class, 'index']);
            Route::get('/recipes',    [\App\Http\Controllers\Api\V2\RecipeController::class, 'index']);

            // ── Inventory & Operations ───────────────────────
            Route::get('/expenses',  [\App\Http\Controllers\Api\V2\ExpenseController::class, 'index']);
            Route::post('/expenses', [\App\Http\Controllers\Api\V2\ExpenseController::class, 'store']);
            Route::get('/restocks',  [\App\Http\Controllers\Api\V2\RestockController::class, 'index']);
            Route::post('/restocks', [\App\Http\Controllers\Api\V2\RestockController::class, 'store']);

            // ── Rooms ────────────────────────────────────────
            Route::get('/rooms',                                     [\App\Http\Controllers\Api\V2\RoomController::class, 'index']);
            Route::post('/rooms/{roomId}/sessions/start',            [\App\Http\Controllers\Api\V2\RoomController::class, 'startSession']);
            Route::post('/rooms/{roomId}/sessions/{sessionId}/stop', [\App\Http\Controllers\Api\V2\RoomController::class, 'stopSession']);

            // ── Reports ──────────────────────────────────────
            Route::get('/reports/daily',        [\App\Http\Controllers\Api\V2\ReportController::class, 'daily']);
            Route::get('/reports/top-products', [\App\Http\Controllers\Api\V2\ReportController::class, 'topProducts']);

            // ── Online Orders ────────────────────────────────
            Route::get('/online-orders/pending',       [\App\Http\Controllers\Api\V2\OnlineOrderSyncController::class, 'pending']);
            Route::get('/online-orders/{id}',          [\App\Http\Controllers\Api\V2\OnlineOrderSyncController::class, 'show']);
            Route::post('/online-orders/{id}/confirm', [\App\Http\Controllers\Api\V2\OnlineOrderSyncController::class, 'confirm']);
            Route::post('/online-orders/{id}/complete',[\App\Http\Controllers\Api\V2\OnlineOrderSyncController::class, 'complete']);

        }); // end auth:sanctum & tenant.resolver
    }); // end v2

