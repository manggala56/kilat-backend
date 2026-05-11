<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;

class TenantResolverMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $storeAlias = $request->header('X-Tenant-ID') ?: $request->header('X-Store-Alias');

        if (!$storeAlias) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tenant identification header (X-Tenant-ID or X-Store-Alias) is missing.'
            ], 400);
        }

        $tenant = Tenant::where('store_id', $storeAlias)->where('status', 'active')->first();

        if (!$tenant) {
            return response()->json([
                'status' => 'error',
                'message' => 'Store not found or inactive.'
            ], 404);
        }

        // Bind tenant to service container
        app()->instance('tenant', $tenant);
        
        // Also attach to request for convenience
        $request->attributes->set('tenant', $tenant);

        return $next($request);
    }
}
