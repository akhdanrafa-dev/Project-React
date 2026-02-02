<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\BugTicket;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tickets = BugTicket::whereNull('ticket_number')->orderBy('created_at')->get();
        
        foreach ($tickets as $ticket) {
            $year = $ticket->created_at->format('Y');
            $month = $ticket->created_at->format('m');
            
            $latestTicket = BugTicket::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->whereNotNull('ticket_number')
                ->latest('id')
                ->first();
            
            $sequence = ($latestTicket ? (int) substr($latestTicket->ticket_number, -4) : 0) + 1;
            $ticket->ticket_number = 'TKT-' . $year . $month . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
            $ticket->save();
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
