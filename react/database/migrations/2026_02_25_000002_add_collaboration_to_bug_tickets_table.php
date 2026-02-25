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
            // Update enum status untuk include 'collab'
            $table->enum('collaboration_type', ['solo', 'collab'])->default('solo')->after('difficulty_level');
            $table->json('collaborators')->nullable()->after('collaboration_type')->comment('Array of collaborator admin IDs');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bug_tickets', function (Blueprint $table) {
            $table->dropColumn(['collaboration_type', 'collaborators']);
        });
    }
};
