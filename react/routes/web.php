<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

use App\Http\Controllers\UserController;
use App\Http\Controllers\BugTicketController;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\ChatbotAIController;
use App\Http\Controllers\AdminITController;
use App\Http\Controllers\StaffProdukController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AlertController;
use App\Models\Product;

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
        
        Route::get('/staff-alerts', fn () => Inertia::render('staff-alerts'))
            ->name('staff.alerts');
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
    
    // Page Routes (harus didefinisikan sebelum API routes)
    Route::get('/admin-it/statistics-page', function () {
        return Inertia::render('AdminITStatistics');
    })->name('admin-it.statistics.page');

    Route::get('/admin-it/ranking-admin', function () {
        return Inertia::render('admin-it-ranking-admin');
    })->middleware('developer')->name('admin-it.ranking-admin');

    // API Routes
    Route::get(
        '/admin-it/statistics/{adminId}',
        [BugTicketController::class, 'getAdminStats']
    )->name('admin-it.statistics');

    Route::get(
        '/admin-it/rankings',
        [BugTicketController::class, 'getAllAdminsRanking']
    )->middleware('developer')->name('admin-it.rankings');

    Route::get(
        '/admin-it/rankings/activity-stats',
        [BugTicketController::class, 'getAdminActivityStats']
    )->middleware('developer')->name('admin-it.rankings.activity');

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
    Route::delete('/api/bug-tickets/{bugTicket}', [BugTicketController::class, 'destroy']);
    Route::get('/api/bug-tickets/unread-count', [BugTicketController::class, 'getUnreadCount']);
    Route::patch('/api/bug-tickets/{bugTicket}/mark-as-read', [BugTicketController::class, 'markTicketAsRead']);
    Route::patch('/api/bug-tickets/{bugTicket}/take', [BugTicketController::class, 'take']);
    Route::post('/api/bug-tickets/{bugTicket}/appeal', [BugTicketController::class, 'submitAppeal']);
    Route::post('/api/chatbot/reply', [ChatbotAIController::class, 'reply']);

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
        return response()->json([
            'users' => \App\Models\User::where('role', 'staff')->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->name,
                    'role' => $user->role,
                    'is_active' => true,
                    'status' => 'active',
                    'lastSeen' => now()->subMinutes(rand(1, 60))->toISOString(),
                ];
            })
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Developers API (for staff chat)
    |--------------------------------------------------------------------------
    */
    Route::get('/api/developers', function () {
        return response()->json([
            'users' => \App\Models\User::where('role', 'developer')->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->name,
                    'role' => $user->role,
                    'is_active' => true,
                    'status' => 'active',
                    'lastSeen' => now()->subMinutes(rand(1, 60))->toISOString(),
                ];
            })
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Users Management
    |--------------------------------------------------------------------------
    */
    Route::resource('users', UserController::class);

    /*
    |--------------------------------------------------------------------------
    | Kelola Produk - Staff & Developer
    |--------------------------------------------------------------------------
    */
    Route::get('/kelola-produk', [StaffProdukController::class, 'index'])
        ->name('kelola.produk')
        ->middleware('auth');

    Route::post('/kelola-produk', [StaffProdukController::class, 'store'])
        ->name('kelola.produk.store')
        ->middleware('auth');
    
    Route::patch('/kelola-produk/{id}', [StaffProdukController::class, 'update'])
        ->name('kelola.produk.update')
        ->middleware('auth');

    /*
    |--------------------------------------------------------------------------
    | Product Alerts - Developer & Staff
    |--------------------------------------------------------------------------
    */
    Route::post('/alerts', [AlertController::class, 'store'])
        ->name('alerts.store')
        ->middleware(['auth', 'developer']);
    
    Route::get('/alerts/staff', [AlertController::class, 'getStaffAlerts'])
        ->name('alerts.staff')
        ->middleware(['auth', 'staff']);

    Route::get('/alerts/staff/history', [AlertController::class, 'getStaffAlertsHistory'])
        ->name('alerts.staff.history')
        ->middleware(['auth', 'staff']);
    
    Route::patch('/alerts/{alert}', [AlertController::class, 'complete'])
        ->name('alerts.complete')
        ->middleware(['auth', 'staff']);

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
    Route::middleware(['staff'])->group(function () {
        Route::get('/staff/developer-management', fn () => Inertia::render('staff-developer-management'))
            ->name('staff.developer.management');

        Route::get('/staff/chat/{developerId}', function ($developerId) {
            return Inertia::render('staff-developer-chat', [
                'developerId' => (int) $developerId,
            ]);
        })->name('staff.chat');
    });

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

        Route::get('/developer/pantau-produk', fn () => Inertia::render('developer/pantau-produk'))
            ->name('developer.pantau-produk');

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

        Route::get('/developer/developer-management', fn () => Inertia::render('staff-developer-management'))
            ->name('developer.management');
    });

    Route::get('/laporan-bug', fn () => Inertia::render('laporan-bug'))
        ->name('laporan.bug');

    Route::get('/test-bug-api', fn () => Inertia::render('test-bug-api'))
        ->name('test.bug.api');

    Route::get('/debug-products', function () {
        $products = \App\Models\Product::with('category')->get();
        return response()->json([
            'total' => $products->count(),
            'products' => $products->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => $p->category?->name ?? 'No category',
            ])
        ]);
    });

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
    | Orders API
    |--------------------------------------------------------------------------
    */
    Route::get('/api/orders', [OrderController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Catalog Products API
    |--------------------------------------------------------------------------
    */
    Route::get('/api/catalog-products', function () {
        if (Product::count() === 0) {
            Artisan::call('db:seed', [
                '--class' => \Database\Seeders\CategorySeeder::class,
                '--force' => true,
            ]);

            Artisan::call('db:seed', [
                '--class' => \Database\Seeders\ProductSeeder::class,
                '--force' => true,
            ]);
        }

        $products = Product::with('category')
            ->orderBy('id')
            ->get()
            ->map(function (Product $product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => (float) $product->price,
                    'discount' => (float) ($product->discount ?? 0),
                    'stock' => (int) $product->stock,
                    'image' => $product->image,
                    'category_slug' => $product->category?->slug,
                    'category_name' => $product->category?->name,
                ];
            })
            ->values();

        return response()->json([
            'products' => $products,
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Checkout API
    |--------------------------------------------------------------------------
    */
    Route::post('/api/checkout', function (Request $request) {
        try {
            if (Product::count() === 0) {
                Artisan::call('db:seed', [
                    '--class' => \Database\Seeders\CategorySeeder::class,
                    '--force' => true,
                ]);

                Artisan::call('db:seed', [
                    '--class' => \Database\Seeders\ProductSeeder::class,
                    '--force' => true,
                ]);
            }

            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|integer|min:1',
                'items.*.product_name' => 'required|string',
                'items.*.sku' => 'nullable|string|max:255',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price' => 'required|numeric|min:0',
                'items.*.image' => 'nullable|string',
                'subtotal' => 'required|numeric|min:0',
                'shipping_cost' => 'required|numeric|min:0',
                'total' => 'required|numeric|min:0',
            ]);

            $user = auth()->user();

            [$order, $updatedStocks] = DB::transaction(function () use ($validated, $user) {
                $requestedItems = collect($validated['items'])->map(function ($item) {
                    return [
                        'product_id' => (int) $item['product_id'],
                        'product_name' => trim((string) $item['product_name']),
                        'sku' => isset($item['sku']) ? trim((string) $item['sku']) : null,
                        'quantity' => (int) $item['quantity'],
                        'price' => $item['price'],
                        'image' => $item['image'] ?? null,
                    ];
                });

                $requestedProductIds = $requestedItems
                    ->pluck('product_id')
                    ->filter(fn ($id) => $id > 0)
                    ->unique()
                    ->values();

                $productsByRequestedId = Product::whereIn('id', $requestedProductIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $resolvedItems = $requestedItems->map(function ($item) use ($productsByRequestedId) {
                    $product = $productsByRequestedId->get($item['product_id']);

                    if (!$product && !empty($item['sku'])) {
                        $product = Product::where('sku', $item['sku'])
                            ->lockForUpdate()
                            ->first();
                    }

                    if (!$product && $item['product_name'] !== '') {
                        $product = Product::where('name', $item['product_name'])
                            ->lockForUpdate()
                            ->first();
                    }

                    if (!$product) {
                        throw ValidationException::withMessages([
                            'items' => [
                                "Produk {$item['product_name']} tidak ditemukan. Hapus item dari keranjang lalu tambah lagi dari katalog.",
                            ],
                        ]);
                    }

                    return [
                        ...$item,
                        'resolved_product_id' => (int) $product->id,
                        'resolved_product_name' => (string) $product->name,
                    ];
                });

                $resolvedProductIds = $resolvedItems
                    ->pluck('resolved_product_id')
                    ->unique()
                    ->values();

                $products = Product::whereIn('id', $resolvedProductIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $requestedQuantities = $resolvedItems
                    ->groupBy(fn ($item) => (int) $item['resolved_product_id'])
                    ->map(fn ($items) => (int) $items->sum(fn ($item) => (int) $item['quantity']));

                foreach ($requestedQuantities as $productId => $requestedQty) {
                    $product = $products->get((int) $productId);

                    if (!$product) {
                        throw ValidationException::withMessages([
                            'items' => ["Produk dengan ID {$productId} tidak ditemukan."],
                        ]);
                    }

                    if ($requestedQty > $product->stock) {
                        throw ValidationException::withMessages([
                            'items' => ["Stok {$product->name} tidak mencukupi. Sisa {$product->stock} unit."],
                        ]);
                    }
                }

                $order = \App\Models\Order::create([
                    'user_id' => $user->id,
                    'subtotal' => $validated['subtotal'],
                    'shipping_cost' => $validated['shipping_cost'],
                    'total' => $validated['total'],
                    'status' => 'completed',
                ]);

                foreach ($resolvedItems as $item) {
                    $product = $products->get((int) $item['resolved_product_id']);

                    $order->items()->create([
                        'product_id' => (int) ($product?->id ?? $item['resolved_product_id']),
                        'product_name' => $product?->name ?? $item['resolved_product_name'],
                        'quantity' => (int) $item['quantity'],
                        'price' => $item['price'],
                        'image' => $item['image'] ?? null,
                    ]);
                }

                $updatedStocks = [];
                foreach ($requestedQuantities as $productId => $requestedQty) {
                    $product = $products->get((int) $productId);
                    if (!$product) {
                        continue;
                    }

                    $product->stock = max(0, $product->stock - $requestedQty);
                    $product->save();

                    $updatedStocks[] = [
                        'product_id' => $product->id,
                        'stock' => $product->stock,
                    ];
                }

                return [$order, $updatedStocks];
            });

            return response()->json([
                'message' => 'Order created successfully',
                'order_id' => $order->id,
                'updated_stocks' => $updatedStocks,
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => 'Checkout gagal',
                'errors' => $exception->errors(),
            ], 422);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Terjadi kesalahan server saat checkout.',
            ], 500);
        }
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
