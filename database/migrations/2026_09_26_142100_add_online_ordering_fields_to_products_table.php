<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_available_online')->default(true)->after('is_active');
            $table->boolean('is_best_seller')->default(false)->after('is_available_online');
            $table->integer('prep_time_minutes')->default(10)->after('is_best_seller');
            $table->json('tags')->nullable()->after('prep_time_minutes');
            $table->string('calories')->nullable()->after('tags');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'is_available_online',
                'is_best_seller',
                'prep_time_minutes',
                'tags',
                'calories',
            ]);
        });
    }
};
