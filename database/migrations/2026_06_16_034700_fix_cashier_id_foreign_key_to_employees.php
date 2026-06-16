<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop old foreign key referencing 'users' table
            $table->dropForeign(['cashier_id']);
            
            // Re-add foreign key referencing 'employees' table instead
            $table->foreign('cashier_id')
                  ->references('id')
                  ->on('employees')
                  ->nullOnDelete();
        });

        // Also fix cashier_sessions table
        Schema::table('cashier_sessions', function (Blueprint $table) {
            $table->dropForeign(['cashier_id']);
            
            $table->foreign('cashier_id')
                  ->references('id')
                  ->on('employees')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['cashier_id']);
            $table->foreign('cashier_id')
                  ->references('id')
                  ->on('users')
                  ->nullOnDelete();
        });

        Schema::table('cashier_sessions', function (Blueprint $table) {
            $table->dropForeign(['cashier_id']);
            $table->foreign('cashier_id')
                  ->references('id')
                  ->on('users')
                  ->nullOnDelete();
        });
    }
};
