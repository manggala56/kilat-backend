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
        Schema::create('tenant_payment_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('doku_settlement_bank_account_id', 100)->nullable()->index(); // SBA ID dari DOKU
            $table->enum('fee_type', ['fixed', 'percentage', 'hybrid', 'multiple', 'tiered'])->default('fixed');
            $table->decimal('platform_fee_fixed', 12, 2)->default(0.00);                 // misal: 1000.00 (IDR)
            $table->decimal('platform_fee_percent', 5, 2)->default(0.00);                // misal: 5.00 (%)
            $table->decimal('fee_multiple_step', 12, 2)->default(0.00);                  // Basis kelipatan (cth: 50000)
            $table->decimal('fee_multiple_amount', 12, 2)->default(0.00);                // Biaya per kelipatan (cth: 500)
            $table->json('fee_tiers')->nullable();                                        // Array aturan berjenjang (min, max, fixed, percent)
            $table->boolean('is_split_active')->default(true);
            $table->timestamps();

            $table->unique('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_payment_configs');
    }
};
