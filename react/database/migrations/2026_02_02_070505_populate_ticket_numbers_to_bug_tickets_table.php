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
        $tickets = DB::table('bug_tickets')
            ->whereNull('ticket_number')
            ->orderBy('created_at')
            ->get();

        foreach ($tickets as $ticket) {
            $createdAt = \Carbon\Carbon::parse($ticket->created_at);
            $year = $createdAt->format('Y');
            $month = $createdAt->format('m');

            $latestTicket = DB::table('bug_tickets')
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->whereNotNull('ticket_number')
                ->orderByDesc('id')
                ->first();

            $sequence = ($latestTicket ? (int) substr($latestTicket->ticket_number, -4) : 0) + 1;

            DB::table('bug_tickets')
                ->where('id', $ticket->id)
                ->update([
                    'ticket_number' => 'TKT-' . $year . $month . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to undo population
    }
};
