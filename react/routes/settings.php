<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
| Semua halaman settings pakai Inertia + React pages
| Layout di-handle oleh React (SettingsLayout)
*/

Route::middleware(['auth', 'verified'])
    ->prefix('settings')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Default Settings Page
        |--------------------------------------------------------------------------
        */
        Route::get('/', function () {
            return Inertia::render('Setting');
        })->name('settings.index');

        /*
        |--------------------------------------------------------------------------
        | Profile
        |--------------------------------------------------------------------------
        */
        Route::get('/profile', [ProfileController::class, 'edit'])
            ->name('profile.edit');

        Route::patch('/profile', [ProfileController::class, 'update'])
            ->name('profile.update');

        Route::delete('/profile', [ProfileController::class, 'destroy'])
            ->name('profile.destroy');

        /*
        |--------------------------------------------------------------------------
        | Password
        |--------------------------------------------------------------------------
        */
        Route::get('/password', [PasswordController::class, 'edit'])
            ->name('user-password.edit');

        Route::put('/password', [PasswordController::class, 'update'])
            ->middleware('throttle:6,1')
            ->name('user-password.update');

        /*
        |--------------------------------------------------------------------------
        | Appearance (PURE INERTIA PAGE)
        |--------------------------------------------------------------------------
        */
        Route::get('/appearance', function () {
            return Inertia::render('settings/appearance');
        })->name('appearance.edit');

        /*
        |--------------------------------------------------------------------------
        | Two Factor Authentication
        |--------------------------------------------------------------------------
        */
        Route::get('/two-factor', [TwoFactorAuthenticationController::class, 'show'])
            ->name('two-factor.show');
    });
