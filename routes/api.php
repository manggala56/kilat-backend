<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

// Strict Rate Limiting: 60 requests per minute per IP
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->ip());
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

                // ── Transactions ───────────────────────────
                // #12 POST /v1/transactions         — Checkout
                // #13 GET  /v1/transactions         — History
                // #14 GET  /v1/transactions/{id}/items — Detail items
                Route::post('/transactions',              [\App\Http\Controllers\Api\V1\TransactionController::class, 'store']);
                Route::get('/transactions',               [\App\Http\Controllers\Api\V1\TransactionController::class, 'index']);
                Route::get('/transactions/{id}/items',    [\App\Http\Controllers\Api\V1\TransactionController::class, 'items']);

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

                // ── Employees ──────────────────────────────
                // #21 GET /v1/employees
                Route::get('/employees', [\App\Http\Controllers\Api\V1\EmployeeController::class, 'index']);

            }); // end tenant.resolver
        }); // end auth:sanctum
    }); // end v1
