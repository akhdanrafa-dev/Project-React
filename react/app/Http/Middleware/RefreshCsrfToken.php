<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RefreshCsrfToken
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (Auth::check() && method_exists($response, 'header')) {
            $response->header('X-CSRF-Token', csrf_token());
        }

        return $response;
    }
}
