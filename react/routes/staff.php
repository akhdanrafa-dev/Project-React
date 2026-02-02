# routes/staff.php - Staff Routes

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StaffDashboardController;
use App\Http\Controllers\StaffProdukController;
use App\Http\Controllers\StaffLaporanController;
use App\Http\Controllers\StaffSettingsController;

Route::middleware(['auth:sanctum', 'verified', 'role:staff'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [StaffDashboardController::class, 'index'])
        ->name('dashboard');

    // Products Management
    Route::prefix('produk')->name('produk.')->group(function () {
        Route::get('/', [StaffProdukController::class, 'index'])
            ->name('index');
        Route::post('/', [StaffProdukController::class, 'store'])
            ->name('store');
        Route::put('/{id}', [StaffProdukController::class, 'update'])
            ->name('update');
        Route::delete('/{id}', [StaffProdukController::class, 'destroy'])
            ->name('destroy');
    });

    // Reports
    Route::prefix('laporan')->name('laporan.')->group(function () {
        Route::get('/', [StaffLaporanController::class, 'index'])
            ->name('index');
        Route::post('/', [StaffLaporanController::class, 'generate'])
            ->name('generate');
        Route::get('/{id}', [StaffLaporanController::class, 'show'])
            ->name('show');
        Route::get('/{id}/download', [StaffLaporanController::class, 'download'])
            ->name('download');
    });

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [StaffSettingsController::class, 'index'])
            ->name('index');
        Route::post('/profile', [StaffSettingsController::class, 'updateProfile'])
            ->name('profile.update');
        Route::post('/password', [StaffSettingsController::class, 'changePassword'])
            ->name('password.update');
        Route::post('/notifications', [StaffSettingsController::class, 'updateNotifications'])
            ->name('notifications.update');
        Route::post('/logout-all', [StaffSettingsController::class, 'logoutAllDevices'])
            ->name('logout-all');
    });
});
