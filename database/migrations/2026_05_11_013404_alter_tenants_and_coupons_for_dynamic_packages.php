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
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('subscription_plan');
            $table->foreignId('subscription_package_id')->nullable()->constrained('subscription_packages')->nullOnDelete();
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn('sales_name');
            $table->enum('type', ['discount', 'penjualan'])->default('discount');
            $table->foreignId('sales_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('subscription_package_id')->nullable()->constrained('subscription_packages')->nullOnDelete();
            $table->integer('duration_in_days')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['subscription_package_id']);
            $table->dropColumn('subscription_package_id');
            $table->enum('subscription_plan', ['basic', 'pro', 'enterprise'])->default('basic');
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->dropForeign(['sales_id']);
            $table->dropForeign(['subscription_package_id']);
            $table->dropColumn(['type', 'sales_id', 'subscription_package_id', 'duration_in_days']);
            $table->string('sales_name')->default('');
        });
    }
};
