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
        Schema::create('cashier_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cashier_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('clock_in_time');
            $table->timestamp('clock_out_time')->nullable();
            $table->decimal('starting_cash', 15, 2)->default(0);
            $table->decimal('system_recorded_cash', 15, 2)->nullable();
            $table->decimal('actual_cash_input', 15, 2)->nullable();
            $table->decimal('discrepancy', 15, 2)->nullable();
            $table->integer('total_transactions')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashier_sessions');
    }
};
