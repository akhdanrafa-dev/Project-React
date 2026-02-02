// app/Http/Controllers/StaffLaporanController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class StaffLaporanController extends Controller
{
    /**
     * Display reports list
     */
    public function index(Request $request)
    {
        $type = $request->query('type', 'all');

        // Di production, fetch dari database dengan filter
        $reports = [
            [
                'id' => 1,
                'title' => 'Laporan Penjualan Harian',
                'date' => '28 Jan 2025',
                'type' => 'Penjualan',
                'period' => 'Hari Ini',
                'status' => 'Completed',
                'size' => '2.4 MB',
            ],
            [
                'id' => 2,
                'title' => 'Laporan Inventori Mingguan',
                'date' => '27 Jan 2025',
                'type' => 'Inventori',
                'period' => 'Minggu Ini',
                'status' => 'Completed',
                'size' => '1.8 MB',
            ],
            [
                'id' => 3,
                'title' => 'Laporan Performa Staff Bulanan',
                'date' => '26 Jan 2025',
                'type' => 'Performa',
                'period' => 'Bulan Januari',
                'status' => 'Completed',
                'size' => '3.2 MB',
            ],
            // ... more reports
        ];

        if ($type !== 'all') {
            $reports = array_filter($reports, fn($r) => strtolower($r['type']) === strtolower($type));
        }

        return Inertia::render('StaffLaporan', [
            'reports' => array_values($reports),
            'stats' => [
                'totalReports' => count($reports),
                'completedReports' => count(array_filter($reports, fn($r) => $r['status'] === 'Completed')),
                'pendingReports' => count(array_filter($reports, fn($r) => $r['status'] === 'Pending')),
                'reportTypes' => 5,
            ],
        ]);
    }

    /**
     * Generate a new report
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:penjualan,inventori,performa,analisis,komplain',
            'period' => 'required|string',
            'format' => 'required|in:pdf,excel',
        ]);

        // Generate report logic
        // Report::create($validated);

        return redirect()->route('staff.laporan.index')
            ->with('message', 'Laporan berhasil dibuat');
    }

    /**
     * Download report file
     */
    public function download($id)
    {
        // Download logic
        // return Storage::download("reports/{$id}.pdf");
    }

    /**
     * View report details
     */
    public function show($id)
    {
        return Inertia::render('StaffLaporan.Show', [
            'report' => [
                'id' => $id,
                'title' => 'Laporan Penjualan Harian',
                'date' => '28 Jan 2025',
                'type' => 'Penjualan',
                'period' => 'Hari Ini',
                'status' => 'Completed',
                'content' => '...',
            ],
        ]);
    }
}
