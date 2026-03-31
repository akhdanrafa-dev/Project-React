<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(
            "ALTER TABLE bug_tickets MODIFY difficulty_level ENUM('easy', 'medium', 'hard') NULL DEFAULT NULL"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(
            "ALTER TABLE bug_tickets MODIFY difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium'"
        );
    }
};
