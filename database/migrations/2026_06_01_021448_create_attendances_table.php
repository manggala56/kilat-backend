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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->dateTime('clock_in_time');
            $table->dateTime('clock_out_time')->nullable();
            $table->decimal('starting_cash', 15, 2)->default(0);
            $table->decimal('system_recorded_cash', 15, 2)->nullable();
            $table->decimal('actual_cash_input', 15, 2)->nullable();
            $table->decimal('discrepancy', 15, 2)->nullable();
            $table->integer('total_transactions')->default(0)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
