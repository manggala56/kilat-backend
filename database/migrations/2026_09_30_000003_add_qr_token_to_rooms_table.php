<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            if (!Schema::hasColumn('rooms', 'qr_token')) {
                $table->string('qr_token', 32)->nullable()->unique()->after('status');
            }
        });

        // Generate unique tokens for existing rooms
        $rooms = DB::table('rooms')->whereNull('qr_token')->orWhere('qr_token', '')->get();
        foreach ($rooms as $room) {
            do {
                $token = Str::lower(Str::random(10));
            } while (DB::table('rooms')->where('qr_token', $token)->exists());

            DB::table('rooms')->where('id', $room->id)->update([
                'qr_token' => $token,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            if (Schema::hasColumn('rooms', 'qr_token')) {
                $table->dropColumn('qr_token');
            }
        });
    }
};
