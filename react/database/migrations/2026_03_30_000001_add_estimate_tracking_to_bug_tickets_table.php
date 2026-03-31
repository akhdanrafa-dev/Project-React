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
            $table->timestamp('estimated_completion_at')
                ->nullable()
                ->after('resolved_at');
            $table->foreignId('estimate_updated_by')
                ->nullable()
                ->after('estimated_completion_at')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('estimate_updated_at')
                ->nullable()
                ->after('estimate_updated_by');
            $table->text('estimate_change_reason')
                ->nullable()
                ->after('estimate_updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bug_tickets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('estimate_updated_by');
            $table->dropColumn([
                'estimated_completion_at',
                'estimate_updated_at',
                'estimate_change_reason',
            ]);
        });
    }
};
