<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bug_tickets', function (Blueprint $table) {
            $table->enum('difficulty_level', ['easy', 'medium', 'hard'])->default('medium')->after('priority');
            $table->timestamp('taken_at')->nullable()->after('assigned_to');
            $table->timestamp('resolved_at')->nullable()->after('taken_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bug_tickets', function (Blueprint $table) {
            $table->dropColumn(['difficulty_level', 'taken_at', 'resolved_at']);
        });
    }
};
