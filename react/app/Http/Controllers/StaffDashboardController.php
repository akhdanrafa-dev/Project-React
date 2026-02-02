// app/Http/Controllers/StaffDashboardController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class StaffDashboardController extends Controller
{
    /**
     * Display the staff dashboard
     */
    public function index(Request $request)
    {
        return Inertia::render('StaffDashboard', [
            'stats' => [
                'totalLaporan' => 24,
                'produkDikelola' => 156,
                'totalPenjualan' => 'Rp 45.2M',
                'tugasPending' => 8,
            ],
            'recentActivities' => [
                [
                    'title' => 'Laporan Penjualan Harian',
                    'time' => 'Hari ini, 10:30 AM',
                ],
                [
                    'title' => 'Update Stok Produk',
                    'time' => 'Kemarin, 02:15 PM',
                ],
                [
                    'title' => 'Verifikasi Produk Baru',
                    'time' => '2 hari lalu, 09:00 AM',
                ],
            ],
        ]);
    }
}
