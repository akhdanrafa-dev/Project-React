<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/checkout',
        'api/orders',
        'api/bug-tickets',
        'api/bug-tickets/*',
        'api/messages',
        'api/messages/*',
        'api/staff-developer-chats',
        'api/staff-developer-chats/*',
    ];
}
