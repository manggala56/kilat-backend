<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

// Strict Rate Limiting: 60 requests per minute per IP
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->ip());
});

// API Versioning (/api/v1) and applying middlewares
Route::prefix('v1')
    ->middleware(['throttle:api', 'api.key'])
    ->group(function () {
        
        // --- Authentication ---
        Route::post('/auth/login', [\App\Http\Controllers\Api\V1\AuthController::class, 'login']);

        // Public endpoints (needs API key but unauthenticated)
        Route::get('/ping', function () {
            return response()->json(['status' => 'success', 'message' => 'API is running']);
        });

        // Protected endpoints (needs Sanctum auth)
        Route::middleware(['auth:sanctum'])->group(function () {
            
            Route::post('/auth/logout', [\App\Http\Controllers\Api\V1\AuthController::class, 'logout']);

            // Endpoints that need Tenant Resolver
            Route::middleware(['tenant.resolver'])->group(function () {
                
                Route::get('/user', function (Request $request) {
                    return response()->json([
                        'status' => 'success',
                        'data' => [
                            'user' => $request->user(),
                            'active_tenant' => app('tenant'),
                        ],
                    ]);
                });

                // --- MODUL 2: Master Data & Catalog ---
                Route::prefix('catalog')->group(function () {
                    Route::get('/sync', [\App\Http\Controllers\Api\V1\CatalogController::class, 'sync']);
                    Route::post('/products', [\App\Http\Controllers\Api\V1\CatalogController::class, 'storeProduct']);
                    Route::put('/products/{id}', [\App\Http\Controllers\Api\V1\CatalogController::class, 'updateProduct']);
                });

                // --- MODUL 2: Inventory ---
                Route::prefix('inventory')->group(function () {
                    Route::get('/status', [\App\Http\Controllers\Api\V1\InventoryController::class, 'status']);
                    Route::post('/adjust', [\App\Http\Controllers\Api\V1\InventoryController::class, 'adjust']);
                });

                // --- MODUL 2: POS Engine ---
                Route::prefix('pos')->group(function () {
                    Route::post('/checkout', [\App\Http\Controllers\Api\V1\PosController::class, 'checkout']);
                    Route::post('/sync-offline', [\App\Http\Controllers\Api\V1\PosController::class, 'syncOffline']);
                });
            });
        });
    });
