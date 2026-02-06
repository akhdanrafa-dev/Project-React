<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use App\Http\Controllers\UserController;
use App\Http\Controllers\BugTicketController;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\AdminITController;
use App\Http\Controllers\StaffProdukController;

/*
|--------------------------------------------------------------------------
| Redirect Root
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return redirect('/login');
})->name('home');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */
    Route::get('/dashboard', function () {
        $user = auth()->user();

        switch ($user->role) {
            case 'user':
                return Inertia::render('user-dashboard');
            case 'staff':
                return Inertia::render('staff-dashboard');
            case 'developer':
                return Inertia::render('developer-dashboard');
            case 'admin_it':
                return Inertia::render('admin-it-dashboard');
            default:
                return Inertia::render('dashboard');
        }
    })->name('dashboard');

    Route::middleware(['staff'])->group(function () {
        Route::get('/staff-dashboard', fn () => Inertia::render('staff-dashboard'))
            ->name('staff.dashboard');
    });

    Route::get('/developer-dashboard', fn () => Inertia::render('developer-dashboard'))
        ->name('developer.dashboard');

    Route::get('/admin-it-dashboard', fn () => Inertia::render('admin-it-dashboard'))
        ->name('admin-it.dashboard');

    /*
    |--------------------------------------------------------------------------
    | Admin IT Profile
    |--------------------------------------------------------------------------
    */
    // redirect profile ke user login
    Route::get('/admin-it/profile', function () {
        return redirect()->route(
            'admin-it.profile.show',
            ['id' => auth()->id()]
        );
    })->name('admin-it.profile');

    // profile by id
    Route::get(
        '/admin-it/profile/{id}',
        [AdminITController::class, 'showProfile']
    )->name('admin-it.profile.show');

    /*
    |--------------------------------------------------------------------------
    | Admin IT Statistics & Ranking
    |--------------------------------------------------------------------------
    */
    Route::get(
        '/admin-it/statistics/{adminId}',
        [BugTicketController::class, 'getAdminStats']
    )->name('admin-it.statistics');

    Route::get(
        '/admin-it/rankings',
        [BugTicketController::class, 'getAllAdminsRanking']
    )->name('admin-it.rankings');

    Route::get('/admin-it/statistics-page', function () {
        return Inertia::render('AdminITStatistics');
    })->name('admin-it.statistics.page');

    /*
    |--------------------------------------------------------------------------
    | Admin IT Tickets & Chat
    |--------------------------------------------------------------------------
    */
    Route::get('/admin-it/tickets', fn () => Inertia::render('admin-it-tickets'))
        ->name('admin-it.tickets');

    Route::get('/admin-it/chats', fn () => Inertia::render('admin-it-chats'))
        ->name('admin-it.chats');

    Route::get('/admin-it/chat-archives', fn () => Inertia::render('admin-it-chat-archive'))
        ->name('admin-it.chat-archives');

    Route::get('/admin-it/ticket/{ticketId}', function ($ticketId) {
        return Inertia::render('admin-it-chat', [
            'ticketId' => (int) $ticketId,
        ]);
    })->name('admin-it.chat');

    /*
    |--------------------------------------------------------------------------
    | Bug Tickets API
    |--------------------------------------------------------------------------
    */
    Route::get('/api/bug-tickets', [BugTicketController::class, 'index']);
    Route::post('/api/bug-tickets', [BugTicketController::class, 'store']);
    Route::get('/api/bug-tickets/{bugTicket}', [BugTicketController::class, 'show']);
    Route::patch('/api/bug-tickets/{bugTicket}', [BugTicketController::class, 'update']);
    Route::get('/api/bug-tickets/unread-count', [BugTicketController::class, 'getUnreadCount']);
    Route::patch('/api/bug-tickets/{bugTicket}/mark-as-read', [BugTicketController::class, 'markTicketAsRead']);
    Route::post('/api/bug-tickets/{bugTicket}/appeal', [BugTicketController::class, 'submitAppeal']);

    /*
    |--------------------------------------------------------------------------
    | Chat Messages API
    |--------------------------------------------------------------------------
    */
    Route::post('/api/bug-tickets/{bugTicket}/messages', [ChatMessageController::class, 'store']);
    Route::get('/api/bug-tickets/{bugTicket}/messages', [ChatMessageController::class, 'getMessages']);
    Route::patch('/api/messages/{chatMessage}/mark-as-read', [ChatMessageController::class, 'markAsRead']);
    Route::patch('/api/bug-tickets/{bugTicket}/messages/mark-all-as-read', [ChatMessageController::class, 'markAllAsRead']);

    /*
    |--------------------------------------------------------------------------
    | Staff ↔ Developer Chat
    |--------------------------------------------------------------------------
    */
    Route::post('/api/staff-developer-chats/{otherUserId}/messages', [ChatMessageController::class, 'storeStaffDeveloperMessage']);
    Route::get('/api/staff-developer-chats/{otherUserId}/messages', [ChatMessageController::class, 'getStaffDeveloperMessages']);
    Route::delete('/api/staff-developer-chats/{otherUserId}/messages', [ChatMessageController::class, 'deleteStaffDeveloperMessages']);

    /*
    |--------------------------------------------------------------------------
    | Staff Users API (for developer chat)
    |--------------------------------------------------------------------------
    */
    Route::get('/api/staff-users', function () {
        return response()->json(
            \App\Models\User::where('role', 'staff')->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'status' => 'active', // Default status
                    'lastSeen' => now()->subMinutes(rand(1, 60))->toISOString(),
                ];
            })
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Users Management
    |--------------------------------------------------------------------------
    */
    Route::resource('users', UserController::class);

    /*
    |--------------------------------------------------------------------------
    | Staff Produk
    |--------------------------------------------------------------------------
    */
    Route::middleware(['staff'])->group(function () {
        Route::get('/kelola-produk', [StaffProdukController::class, 'index'])
            ->name('kelola.produk');
    });

    /*
    |--------------------------------------------------------------------------
    | Laporan
    |--------------------------------------------------------------------------
    */
    Route::get('/laporan', function () {
        $user = auth()->user();

        if ($user->role === 'user') {
            return Inertia::render('user-laporan');
        }

        if ($user->role === 'developer') {
            return Inertia::render('developer/developer-tools');
        }

        return Inertia::render('laporan');
    })->name('laporan');

    /*
    |--------------------------------------------------------------------------
    | Developer Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware(['developer'])->group(function () {
        Route::get('/developer/api', function () {
            return Inertia::render('kelola-pengguna', [
                'users' => \App\Models\User::all()->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'username' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ];
                }),
            ]);
        })->name('developer.api');

        Route::get('/developer/integration', fn () => Inertia::render('developer/developer-integration'))
            ->name('developer.integration');

        Route::get('/developer/debug', fn () => Inertia::render('developer/developer-debug'))
            ->name('developer.debug');

        Route::get('/developer/performance', fn () => Inertia::render('AdminITStatistics'))
            ->name('developer.performance');

        Route::get('/developer/chat/{staffId}', function ($staffId) {
            return Inertia::render('developer/developer-chat', [
                'staffId' => (int) $staffId,
            ]);
        })->name('developer.chat');
    });

    Route::get('/laporan-bug', fn () => Inertia::render('laporan-bug'))
        ->name('laporan.bug');

    Route::get('/test-bug-api', fn () => Inertia::render('test-bug-api'))
        ->name('test.bug.api');

    /*
    |--------------------------------------------------------------------------
    | Katalog & Keranjang
    |--------------------------------------------------------------------------
    */
    Route::get('/katalog', fn () => Inertia::render('katalog'))->name('katalog');
    Route::get('/keranjang', fn () => Inertia::render('keranjang'))->name('keranjang');
    Route::get('/history-pembelian', fn () => Inertia::render('history-pembelian'))->name('history.pembelian');
    Route::get('/layanan-kami-lainnya', fn () => Inertia::render('layanan-kami-lainnya'))->name('layanan.kami.lainnya');

    /*
    |--------------------------------------------------------------------------
    | Checkout API
    |--------------------------------------------------------------------------
    */
    Route::post('/api/checkout', function (Request $request) {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|numeric',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.image' => 'nullable|string',
            'subtotal' => 'required|numeric|min:0',
            'shipping_cost' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
        ]);

        $user = auth()->user();

        $order = \App\Models\Order::create([
            'user_id' => $user->id,
            'subtotal' => $validated['subtotal'],
            'shipping_cost' => $validated['shipping_cost'],
            'total' => $validated['total'],
            'status' => 'completed',
        ]);

        foreach ($validated['items'] as $item) {
            $order->items()->create([
                'product_id' => $item['product_id'],
                'product_name' => $item['product_name'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'image' => $item['image'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Order created successfully',
            'order_id' => $order->id,
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */
    Route::post('/logout', function (Request $request) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    })->name('logout');

    Route::get('/logout-confirm', fn () => Inertia::render('logout'))
        ->name('logout.page');
});

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
*/
require __DIR__ . '/settings.php';
require __DIR__ . '/developer-settings.php';
