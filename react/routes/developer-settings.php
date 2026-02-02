<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Developer Settings Routes
|--------------------------------------------------------------------------
| Routes khusus untuk developer settings
| Menggunakan middleware CheckDeveloperRole
*/

Route::middleware(['auth', 'verified', 'developer'])
    ->prefix('developer-settings')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Default Developer Settings Page
        |--------------------------------------------------------------------------
        */
        Route::get('/', function () {
            return Inertia::render('developer-settings/index');
        })->name('developer-settings.index');

        /*
        |--------------------------------------------------------------------------
        | Developer Password
        |--------------------------------------------------------------------------
        */
        Route::get('/password', function () {
            return Inertia::render('developer-settings/password');
        })->name('developer-settings.password');

        /*
        |--------------------------------------------------------------------------
        | Developer Appearance
        |--------------------------------------------------------------------------
        */
        Route::get('/appearance', function () {
            return Inertia::render('developer-settings/appearance');
        })->name('developer-settings.appearance');
    });
