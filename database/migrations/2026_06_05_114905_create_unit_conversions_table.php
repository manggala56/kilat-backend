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
        Schema::create('unit_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('base_unit');
            $table->string('target_unit');
            $table->decimal('conversion_rate', 15, 6); // precision up to 6 decimals
            $table->timestamps();
            
            // Ensure no duplicate conversions per tenant
            $table->unique(['tenant_id', 'base_unit', 'target_unit']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_conversions');
    }
};
