<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah max_outlets ke subscription_packages
        Schema::table('subscription_packages', function (Blueprint $table) {
            $table->integer('max_outlets')->default(1)->after('duration_in_days')
                  ->comment('Maksimal jumlah outlet/toko yang bisa dibuat owner');
        });

        // Tambah subscription_package_id yang benar ke tenants (menggantikan subscription_plan enum)
        // Cek jika kolom sudah ada (dari migrasi sebelumnya)
        if (!Schema::hasColumn('tenants', 'subscription_package_id')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->foreignId('subscription_package_id')
                      ->nullable()
                      ->constrained('subscription_packages')
                      ->nullOnDelete()
                      ->after('status');
            });
        }
    }

    public function down(): void
    {
        Schema::table('subscription_packages', function (Blueprint $table) {
            $table->dropColumn('max_outlets');
        });
    }
};
