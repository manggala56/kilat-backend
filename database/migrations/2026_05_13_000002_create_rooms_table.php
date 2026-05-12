<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name'); // e.g. "PS5 Room 1"
            $table->enum('type', ['REGULAR', 'VIP'])->default('REGULAR');
            $table->decimal('hourly_rate', 15, 2)->default(0);
            $table->enum('status', ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'])->default('AVAILABLE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
