<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-Api-Key');
        $validKey = config('app.api_key', env('APP_API_KEY', 'kilatz-secret-key-123'));

        if (!$apiKey || $apiKey !== $validKey) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or missing API Key.'
            ], 401);
        }

        return $next($request);
    }
}
