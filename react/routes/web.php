<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BugTicketController;
use App\Http\Controllers\ChatMessageController;

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

        if ($user->role === 'user') {
            return Inertia::render('user-dashboard');
        } elseif ($user->role === 'staff') {
            return Inertia::render('staff-dashboard');
        } elseif ($user->role === 'developer') {
            return Inertia::render('developer-dashboard');
        } elseif ($user->role === 'admin_it') {
            return Inertia::render('admin-it-dashboard');
        }

        return Inertia::render('dashboard');
    })->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Staff Dashboard
    |--------------------------------------------------------------------------
    */
    Route::get('/staff-dashboard', function () {
        return Inertia::render('staff-dashboard');
    })->name('staff.dashboard');

    Route::get('/developer-dashboard', function () {
        return Inertia::render('developer-dashboard');
    })->name('developer.dashboard');

    Route::get('/admin-it-dashboard', function () {
        return Inertia::render('admin-it-dashboard');
    })->name('admin-it.dashboard');

    Route::get('/admin-it/ticket/{ticketId}', function ($ticketId) {
        return Inertia::render('admin-it-chat', ['ticketId' => (int)$ticketId]);
    })->name('admin-it.chat');

    Route::patch(
    '/api/bug-tickets/{bugTicket}/take',
    [BugTicketController::class, 'take']
)->middleware(['auth', 'verified']);


    Route::get('/admin-it/statistics', function () {
        return Inertia::render('admin-it-statistics');
    })->name('admin-it.statistics');

    Route::get('/admin-it/rankings', function () {
        return Inertia::render('admin-it-rankings');
    })->name('admin-it.rankings');

    Route::get('/admin-it/chats', function () {
        return Inertia::render('admin-it-chats');
    })->name('admin-it.chats');

    Route::get('/admin-it/chat-archives', function () {
        return Inertia::render('admin-it-chat-archive');
    })->name('admin-it.chat-archives');

    Route::get('/admin-it/profile', function () {
        return Inertia::render('admin-it-profile');
    })->name('admin-it.profile');

    Route::get('/admin-it/tickets', function () {
        return Inertia::render('admin-it-tickets');
    })->name('admin-it.tickets');

    Route::get('/developer/api', function () {
        $users = \App\Models\User::all()->map(function ($user) {
            return [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ];
        });
        
        return Inertia::render('kelola-pengguna', [
            'users' => $users,
        ]);
    })->name('developer.kelola-pengguna');

    Route::get('/developer/tools', function () {
        return Inertia::render('developer/developer-tools');
    })->name('developer.tools');

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

    Route::get('/laporan-bug', function () {
        return Inertia::render('laporan-bug');
    })->name('laporan.bug');

    Route::get('/test-bug-api', function () {
        return Inertia::render('test-bug-api');
    })->name('test.bug.api');

    /*
    |--------------------------------------------------------------------------
    | Kelola Produk
    |--------------------------------------------------------------------------
    */
    Route::get('/kelola-produk', [\App\Http\Controllers\StaffProdukController::class, 'index'])
        ->name('kelola.produk');

    /*
    |--------------------------------------------------------------------------
    | Katalog & Keranjang
    |--------------------------------------------------------------------------
    */
    Route::get('/katalog', function () {
        return Inertia::render('katalog');
    })->name('katalog');

    Route::get('/keranjang', function () {
        return Inertia::render('keranjang');
    })->name('keranjang');

    Route::get('/history-pembelian', function () {
        return Inertia::render('history-pembelian');
    })->name('history.pembelian');

    /*
    |--------------------------------------------------------------------------
    | API Routes
    |--------------------------------------------------------------------------
    */
    Route::post('/api/checkout', function (Request $request) {
        try {
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create order: ' . $e->getMessage(),
            ], 400);
        }
    });

    Route::get('/api/orders', function (Request $request) {
        try {
            $user = auth()->user();
            
            $orders = \App\Models\Order::where('user_id', $user->id)
                ->with('items')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'orders' => $orders,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch orders: ' . $e->getMessage(),
            ], 400);
        }
    });

    /*
    |--------------------------------------------------------------------------
    | Bug Tickets & Chat
    |--------------------------------------------------------------------------
    */
    Route::get('/api/bug-tickets', [\App\Http\Controllers\BugTicketController::class, 'index']);
    Route::post('/api/bug-tickets', [\App\Http\Controllers\BugTicketController::class, 'store']);
    Route::get('/api/bug-tickets/{bugTicket}', [\App\Http\Controllers\BugTicketController::class, 'show']);
    Route::patch('/api/bug-tickets/{bugTicket}', [\App\Http\Controllers\BugTicketController::class, 'update']);
    Route::get('/api/bug-tickets/unread-count', [\App\Http\Controllers\BugTicketController::class, 'getUnreadCount']);
    Route::patch('/api/bug-tickets/{bugTicket}/mark-as-read', [\App\Http\Controllers\BugTicketController::class, 'markTicketAsRead']);

    Route::post('/api/bug-tickets/{bugTicket}/messages', [\App\Http\Controllers\ChatMessageController::class, 'store']);
    Route::get('/api/bug-tickets/{bugTicket}/messages', [\App\Http\Controllers\ChatMessageController::class, 'getMessages']);
    Route::patch('/api/messages/{chatMessage}/mark-as-read', [\App\Http\Controllers\ChatMessageController::class, 'markAsRead']);
    Route::patch('/api/bug-tickets/{bugTicket}/messages/mark-all-as-read', [\App\Http\Controllers\ChatMessageController::class, 'markAllAsRead']);

    Route::post('/api/bug-tickets/{bugTicket}/appeal', [\App\Http\Controllers\BugTicketController::class, 'submitAppeal']);

    /*
    |--------------------------------------------------------------------------
    | Users (Admin)
    |--------------------------------------------------------------------------
    */
    Route::resource('users', UserController::class);

    /*
    |--------------------------------------------------------------------------
    | Admin IT Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin-it')->group(function () {
        Route::get('/statistics/{adminId}', [\App\Http\Controllers\BugTicketController::class, 'getAdminStats']);
        Route::get('/rankings', [\App\Http\Controllers\BugTicketController::class, 'getAllAdminsRanking']);
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

    Route::get('/logout-confirm', function () {
        return Inertia::render('logout');
    })->name('logout.page');
});

/*
|--------------------------------------------------------------------------
| Settings Routes (DIPISAH)
|--------------------------------------------------------------------------
*/
require __DIR__ . '/settings.php';
require __DIR__ . '/developer-settings.php';
