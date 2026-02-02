<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create sample users with different roles
        User::create([
            'name' => 'Admin IT',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin_it',
        ]);

        User::create([
            'name' => 'Developer',
            'email' => 'developer@example.com',
            'password' => bcrypt('password'),
            'role' => 'developer',
        ]);

        User::create([
            'name' => 'Staff',
            'email' => 'staff@example.com',
            'password' => bcrypt('password'),
            'role' => 'staff',
        ]);

        User::create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);

        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
