<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tickets = DB::table('bug_tickets')->whereNull('ticket_number')->get();
        
        foreach ($tickets as $ticket) {
            $date = $ticket->created_at ? new \DateTime($ticket->created_at) : new \DateTime();
            $year = $date->format('Y');
            $month = $date->format('m');
            
            // Find max sequence for this month
            $latest = DB::table('bug_tickets')
                ->where('ticket_number', 'like', "TKT-{$year}{$month}-%")
                ->orderBy('ticket_number', 'desc')
                ->first();
                
            $sequence = 1;
            if ($latest && preg_match('/-(\d+)$/', $latest->ticket_number, $matches)) {
                $sequence = (int)$matches[1] + 1;
            }
            
            $ticketNumber = 'TKT-' . $year . $month . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
            
            DB::table('bug_tickets')
                ->where('id', $ticket->id)
                ->update(['ticket_number' => $ticketNumber]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
