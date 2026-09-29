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

        $tenant = null;

        if ($storeAlias) {
            $tenant = Tenant::where(function($query) use ($storeAlias) {
                $query->where('store_id', $storeAlias)
                      ->orWhere('id', $storeAlias);
            })->where('status', 'active')->first();
        } elseif ($request->user()) {
            $user = $request->user();
            if (isset($user->tenant_id)) {
                $tenant = Tenant::where('id', $user->tenant_id)->where('status', 'active')->first();
            } elseif (method_exists($user, 'tenant') && $user->tenant) {
                $tenant = $user->tenant;
            }
        }

        if (!$tenant) {
            return response()->json([
                'status' => 'error',
                'message' => 'Store / Tenant not found or inactive. Please provide X-Tenant-ID header.'
            ], $storeAlias ? 404 : 400);
        }

        // Bind tenant to service container
        app()->instance('tenant', $tenant);
        
        // Also attach to request for convenience
        $request->attributes->set('tenant', $tenant);

        return $next($request);
    }
}
