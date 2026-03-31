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
        Schema::create('admin_it_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bug_ticket_id')->nullable()->constrained('bug_tickets')->nullOnDelete();
            $table->string('type', 100);
            $table->string('context_key', 191);
            $table->string('title');
            $table->text('message');
            $table->json('payload')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['user_id', 'bug_ticket_id', 'type', 'context_key'],
                'admin_it_notifications_unique_context',
            );
            $table->index(
                ['user_id', 'read_at', 'created_at'],
                'admin_it_notifications_user_read_created_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_it_notifications');
    }
};
