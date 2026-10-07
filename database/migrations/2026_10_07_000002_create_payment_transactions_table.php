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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->string('invoice_number', 100)->unique();
            $table->string('integration_type', 20)->default('CHECKOUT'); // 'CHECKOUT' atau 'DIRECT_QRIS'
            $table->string('payment_method', 50)->nullable();            // 'QRIS', 'VIRTUAL_ACCOUNT_BCA', dll.
            $table->decimal('gross_amount', 15, 2);
            $table->decimal('platform_fee_amount', 15, 2)->default(0);
            $table->decimal('tenant_net_amount', 15, 2)->default(0);
            $table->string('status', 20)->default('PENDING');            // 'PENDING', 'PAID', 'EXPIRED', 'FAILED'
            $table->text('doku_payment_url')->nullable();                // URL untuk DOKU Checkout
            $table->text('qris_string')->nullable();                     // Raw payload untuk Direct QRIS POS
            $table->string('gateway_reference', 150)->nullable()->index();
            $table->json('raw_response_payload')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status'], 'idx_payment_transactions_lookup');
            $table->index('invoice_number', 'idx_payment_transactions_invoice');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
