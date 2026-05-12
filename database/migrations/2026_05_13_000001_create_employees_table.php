<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->unsignedBigInteger('outlet_id')->nullable(); // referensi ke outlet/tenant branch
            $table->string('name');
            $table->string('username'); // unik per outlet
            $table->string('pin_code'); // hashed 4-6 digit
            $table->enum('role', ['CASHIER', 'SUPERVISOR', 'OWNER'])->default('CASHIER');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Username unik per outlet
            $table->unique(['outlet_id', 'username']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
