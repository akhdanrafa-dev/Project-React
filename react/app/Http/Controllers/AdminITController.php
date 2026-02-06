<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class AdminITController extends Controller
{
    // Tampilkan halaman profile admin IT
    public function showProfile($id)
    {
        $admin = User::findOrFail($id);

        // Bisa pakai Inertia jika menggunakan Inertia + React
        return inertia('AdminITProfile', [
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'bio' => $admin->bio,
                'age' => $admin->age,
                'address' => $admin->address,
                'created_at' => $admin->created_at->toDateString(),
            ],
        ]);
    }
}
