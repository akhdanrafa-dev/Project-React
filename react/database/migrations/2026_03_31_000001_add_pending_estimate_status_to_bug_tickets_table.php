<?php

use App\Models\BugTicket;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement(
                "ALTER TABLE bug_tickets MODIFY COLUMN status ENUM('open', 'pending_estimate', 'in_progress', 'resolved', 'closed', 'diproses kembali') DEFAULT 'open'"
            );
        }

        DB::table('bug_tickets')
            ->whereNotNull('assigned_to')
            ->whereNull('estimated_completion_at')
            ->whereNotIn('status', [
                BugTicket::STATUS_RESOLVED,
                BugTicket::STATUS_CLOSED,
            ])
            ->update([
                'status' => BugTicket::STATUS_PENDING_ESTIMATE,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('bug_tickets')
            ->where('status', BugTicket::STATUS_PENDING_ESTIMATE)
            ->update([
                'status' => BugTicket::STATUS_IN_PROGRESS,
            ]);

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement(
                "ALTER TABLE bug_tickets MODIFY COLUMN status ENUM('open', 'in_progress', 'resolved', 'closed', 'diproses kembali') DEFAULT 'open'"
            );
        }
    }
};
