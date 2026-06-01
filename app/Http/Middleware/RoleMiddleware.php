<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $userRole = strtolower($request->user()?->role ?? '');
        $allowedRoles = array_map('strtolower', $roles);
        
        \Illuminate\Support\Facades\Log::info('RoleMiddleware check:', ['userRole' => $userRole, 'allowedRoles' => $allowedRoles]);

        if (!$request->user() || !in_array($userRole, $allowedRoles)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Forbidden. You do not have the required role to access this resource.'
                ], 403);
            }
            abort(403, 'Forbidden. You do not have the required role to access this resource.');
        }

        return $next($request);
    }
}
