<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah kolom type dan icon ke tabel categories
        Schema::table('categories', function (Blueprint $table) {
            $table->string('type')->default('OTHER')->after('name'); // FOOD | DRINK | OTHER
            $table->string('icon')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['type', 'icon']);
        });
    }
};
