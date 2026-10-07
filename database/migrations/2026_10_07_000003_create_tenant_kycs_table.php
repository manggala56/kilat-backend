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
        Schema::create('tenant_kycs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('id_card_number', 30);                      // NIK KTP (16 digit)
            $table->string('id_card_name', 150);                       // Nama sesuai KTP
            $table->string('id_card_photo_path');                      // Path foto KTP di storage
            $table->string('bank_name', 100);                          // Nama Bank (BCA, Mandiri, BRI, BNI, dll)
            $table->string('bank_account_number', 50);                 // Nomor Rekening Bank
            $table->string('bank_account_holder_name', 150);            // Nama Pemilik Rekening
            $table->string('business_photo_path');                     // Foto Tempat Usaha / Outlet
            $table->string('business_type', 100)->nullable();          // Jenis usaha (cth: F&B, Cafe, Retail)
            $table->enum('status', ['unsubmitted', 'pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();              // Alasan penolakan jika ditolak admin
            $table->timestamp('verified_at')->nullable();              // Waktu persetujuan / penolakan
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete(); // Admin verifikator
            $table->timestamps();

            $table->unique('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_kycs');
    }
};
