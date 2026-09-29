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
        if (Schema::hasTable('subscription_packages')) {
            Schema::table('subscription_packages', function (Blueprint $table) {
                if (!Schema::hasColumn('subscription_packages', 'max_devices_per_outlet')) {
                    $table->integer('max_devices_per_outlet')->default(2)->after('max_outlets')->comment('Maksimal perangkat POS aktif per outlet');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('subscription_packages')) {
            Schema::table('subscription_packages', function (Blueprint $table) {
                if (Schema::hasColumn('subscription_packages', 'max_devices_per_outlet')) {
                    $table->dropColumn('max_devices_per_outlet');
                }
            });
        }
    }
};
