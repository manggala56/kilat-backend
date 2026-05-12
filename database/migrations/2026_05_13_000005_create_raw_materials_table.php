<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->string('unit')->default('pcs'); // pcs, gram, ml, dll
            $table->decimal('stock', 15, 2)->default(0); // bisa desimal misal 1.5 kg
            $table->decimal('cost_per_unit', 15, 2)->default(0); // HPP per satuan
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_materials');
    }
};
