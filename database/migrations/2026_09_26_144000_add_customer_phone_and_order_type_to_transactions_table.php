<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('customer_phone')->nullable()->after('customer_name');
            $table->string('order_type')->default('DINE_IN')->after('table_number'); // DINE_IN | TAKEAWAY
            $table->string('payment_status')->default('PAID')->after('status'); // PAID | UNPAID
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['customer_phone', 'order_type', 'payment_status']);
        });
    }
};
