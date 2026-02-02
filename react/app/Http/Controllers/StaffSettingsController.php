// app/Http/Controllers/StaffSettingsController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class StaffSettingsController extends Controller
{
    /**
     * Display settings page
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('StaffSettings', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'department' => $user->department ?? '',
                'address' => $user->address ?? '',
            ],
            'settings' => [
                'emailNotifications' => true,
                'pushNotifications' => true,
                'smsAlerts' => false,
                'weeklyReport' => true,
            ],
        ]);
    }

    /**
     * Update profile
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . auth()->id(),
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        auth()->user()->update($validated);

        return redirect()->route('staff.settings.index')
            ->with('message', 'Profil berhasil diperbarui');
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        auth()->user()->update([
            'password' => bcrypt($validated['password']),
        ]);

        return redirect()->route('staff.settings.index')
            ->with('message', 'Password berhasil diubah');
    }

    /**
     * Update notification settings
     */
    public function updateNotifications(Request $request)
    {
        $validated = $request->validate([
            'emailNotifications' => 'boolean',
            'pushNotifications' => 'boolean',
            'smsAlerts' => 'boolean',
            'weeklyReport' => 'boolean',
        ]);

        // Update settings di database
        // auth()->user()->settings()->update($validated);

        return redirect()->route('staff.settings.index')
            ->with('message', 'Pengaturan notifikasi berhasil disimpan');
    }

    /**
     * Logout from all devices
     */
    public function logoutAllDevices(Request $request)
    {
        // Invalidate all sessions
        // auth()->user()->tokens()->delete();

        return redirect()->route('login')
            ->with('message', 'Berhasil logout dari semua perangkat');
    }
}
