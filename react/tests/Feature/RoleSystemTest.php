<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class RoleSystemTest extends TestCase
{
    /**
     * Test bahwa role disimpan dengan benar saat create user
     */
    public function test_user_can_be_created_with_role(): void
    {
        $response = $this->post('/users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
            'role' => 'admin_it',
        ]);

        $this->assertTrue(User::where('email', 'test@example.com')->first()->role === 'admin_it');
    }

    /**
     * Test bahwa role dapat diupdate
     */
    public function test_user_role_can_be_updated(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->put("/users/{$user->id}", [
            'name' => $user->name,
            'email' => $user->email,
            'role' => 'staff',
        ]);

        $this->assertEquals('staff', $user->fresh()->role);
    }

    /**
     * Test bahwa invalid role ditolak
     */
    public function test_invalid_role_is_rejected(): void
    {
        $response = $this->post('/users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
            'role' => 'invalid_role',
        ]);

        $response->assertSessionHasErrors('role');
    }

    /**
     * Test bahwa semua role valid diterima
     */
    public function test_all_valid_roles_are_accepted(): void
    {
        $validRoles = ['user', 'staff', 'admin_it', 'developer'];

        foreach ($validRoles as $role) {
            $response = $this->post('/users', [
                'name' => "User {$role}",
                'email' => "user-{$role}@example.com",
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
                'role' => $role,
            ]);

            $user = User::where('email', "user-{$role}@example.com")->first();
            $this->assertEquals($role, $user->role);
        }
    }

    /**
     * Test default role adalah 'user'
     */
    public function test_default_role_is_user(): void
    {
        $user = User::factory()->create();
        $this->assertEquals('user', $user->role);
    }

    /**
     * Test factory dapat membuat user dengan custom role
     */
    public function test_factory_can_set_custom_role(): void
    {
        $user = User::factory()->role('admin_it')->create();
        $this->assertEquals('admin_it', $user->role);
    }

    /**
     * Test bahwa users dapat difilter berdasarkan role
     */
    public function test_users_can_be_filtered_by_role(): void
    {
        User::factory()->count(5)->role('user')->create();
        User::factory()->count(3)->role('staff')->create();
        User::factory()->count(2)->role('admin_it')->create();

        $staffUsers = User::where('role', 'staff')->count();
        $this->assertEquals(3, $staffUsers);
    }
}
