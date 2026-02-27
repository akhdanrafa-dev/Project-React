<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminITController extends Controller
{
    // Tampilkan halaman profile admin IT
    public function showProfile($id)
    {
        $admin = User::findOrFail($id);

        return inertia('AdminITProfile', [
            'admin' => $this->formatAdminProfile($admin),
        ]);
    }

    public function updateProfile(Request $request, $id)
    {
        $currentUser = $request->user();

        if ((int) $currentUser->id !== (int) $id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya dapat mengubah profil Anda sendiri.',
            ], 403);
        }

        $validated = $request->validate([
            'bio' => 'nullable|string|max:1000',
            'date_of_birth' => 'nullable|date|before_or_equal:today',
            'address' => 'nullable|string|max:255',
        ]);

        $dateOfBirth = $validated['date_of_birth'] ?? null;
        $bio = array_key_exists('bio', $validated)
            ? trim((string) $validated['bio'])
            : null;
        $address = array_key_exists('address', $validated)
            ? trim((string) $validated['address'])
            : null;

        if ($bio === '') {
            $bio = null;
        }
        if ($address === '') {
            $address = null;
        }

        $currentUser->update([
            'bio' => $bio,
            'date_of_birth' => $dateOfBirth,
            'age' => $dateOfBirth ? Carbon::parse($dateOfBirth)->age : null,
            'address' => $address,
        ]);

        $currentUser->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'admin' => $this->formatAdminProfile($currentUser),
        ]);
    }

    private function formatAdminProfile(User $admin): array
    {
        $dateOfBirth = $admin->date_of_birth
            ? Carbon::parse($admin->date_of_birth)
            : null;

        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => $admin->role,
            'bio' => $admin->bio,
            'date_of_birth' => $dateOfBirth?->toDateString(),
            'age' => $dateOfBirth ? $dateOfBirth->age : $admin->age,
            'address' => $admin->address,
            'created_at' => $admin->created_at->toDateString(),
        ];
    }
}
