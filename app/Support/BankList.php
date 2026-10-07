<?php

namespace App\Support;

class BankList
{
    /**
     * Get associative array of major Indonesian banks (code/name => Label).
     *
     * @return array<string, string>
     */
    public static function all(): array
    {
        return [
            'BCA'                 => 'Bank Central Asia (BCA)',
            'MANDIRI'             => 'Bank Mandiri',
            'BRI'                 => 'Bank Rakyat Indonesia (BRI)',
            'BNI'                 => 'Bank Negara Indonesia (BNI)',
            'BSI'                 => 'Bank Syariah Indonesia (BSI)',
            'CIMB'                => 'Bank CIMB Niaga',
            'PERMATA'             => 'Bank Permata',
            'DANAMON'             => 'Bank Danamon',
            'BTN'                 => 'Bank Tabungan Negara (BTN)',
            'BTPN'                => 'Bank BTPN / Jenius',
            'JAGO'                => 'Bank Jago',
            'SEABANK'             => 'SeaBank Indonesia',
            'NEO'                 => 'Bank Neo Commerce (BNC)',
            'MEGA'                => 'Bank Mega',
            'OCBC'                => 'Bank OCBC NISP',
            'PANIN'               => 'Bank Panin',
            'BCA_SYARIAH'         => 'BCA Syariah',
            'MUAMALAT'            => 'Bank Muamalat',
            'BPD_JATENG'          => 'Bank Jateng',
            'BPD_JATIM'           => 'Bank Jatim',
            'BPD_DKI'             => 'Bank DKI',
            'BPD_BJB'             => 'Bank BJB',
            'OTHER'               => 'Bank Lainnya',
        ];
    }

    /**
     * Get valid keys for validation rules.
     *
     * @return array<string>
     */
    public static function keys(): array
    {
        return array_keys(self::all());
    }

    /**
     * Get display label for a bank code.
     */
    public static function label(?string $code): string
    {
        if (!$code) {
            return '-';
        }
        return self::all()[$code] ?? $code;
    }
}
