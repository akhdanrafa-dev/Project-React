<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController as FortifyAuthenticatedSessionController;

class AuthenticatedSessionController extends FortifyAuthenticatedSessionController
{
    /**
     * Show the login view.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function create(Request $request)
    {
        return inertia('auth/login', [
            'canResetPassword' => route('password.request'),
            'canRegister' => route('register'),
            'status' => session('status'),
        ]);
    }

    /**
     * Store an authenticated user session.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return mixed
     */
    public function store(Request $request)
    {
        // Validate the request
        $this->validateLogin($request);

        // Attempt to authenticate
        if (! $this->guard->attempt(
            $this->credentials($request), $request->boolean('remember')
        )) {
            $this->throwFailedAuthenticationException($request);
        }

        // If user is authenticated, prevent request flooding by adding delay
        sleep(1);

        return redirect()->intended(route('dashboard'));
    }
}
