<?php

return [
    /*
    |--------------------------------------------------------------------------
    | DOKU Payment Gateway Configuration (v2.0 Hybrid Architecture)
    |--------------------------------------------------------------------------
    */

    'environment' => env('DOKU_ENV', env('DOKU_ENVIRONMENT', 'sandbox')), // 'sandbox' or 'production'

    'base_url'    => env('DOKU_BASE_URL', (
        env('DOKU_ENV', env('DOKU_ENVIRONMENT', 'sandbox')) === 'production'
            ? 'https://api.doku.com'
            : 'https://api-sandbox.doku.com'
    )),

    'client_id'   => env('DOKU_CLIENT_ID', 'MOCK_CLIENT_ID'),
    'secret_key'  => env('DOKU_SECRET_KEY', 'MOCK_SECRET_KEY'),

    // Settlement Bank Account ID utama Kilatz (dari menu Bank Account DOKU)
    'platform_sba_id' => env('DOKU_PLATFORM_SBA_ID', env('DOKU_MAIN_SBA_ID', 'SBA-KILATZ-MAIN')),
    'main_sba_id'     => env('DOKU_PLATFORM_SBA_ID', env('DOKU_MAIN_SBA_ID', 'SBA-KILATZ-MAIN')),

    'default_expiry_minutes' => (int) env('DOKU_EXPIRY_MINUTES', 15),

    // Keys to sanitize / mask before saving raw response payload to database
    'sensitive_keys' => [
        'cvv', 'card_number', 'token', 'access_token', 'secret', 'password',
        'account_number', 'auth_code', 'signature',
    ],
];
