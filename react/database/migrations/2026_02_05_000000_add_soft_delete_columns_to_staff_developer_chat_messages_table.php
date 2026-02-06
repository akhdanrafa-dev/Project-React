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
        Schema::table('staff_developer_chat_messages', function (Blueprint $table) {
            $table->timestamp('deleted_by_staff_at')->nullable()->after('is_read');
            $table->timestamp('deleted_by_developer_at')->nullable()->after('deleted_by_staff_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff_developer_chat_messages', function (Blueprint $table) {
            $table->dropColumn(['deleted_by_staff_at', 'deleted_by_developer_at']);
        });
    }
};
