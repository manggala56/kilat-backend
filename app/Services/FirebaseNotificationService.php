<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseNotificationService
{
    /**
     * Kirim sinyal notifikasi & sinkronisasi data transaksi ke Firebase (FCM v1 + Cloud Firestore + Realtime DB).
     *
     * @param string $storeId Kode unik outlet (e.g. 'kilatz-selatan' atau 'toko-pusat')
     * @param string $status Status pesanan ('PENDING', 'PAID', 'CONFIRMED')
     * @param int|string $transactionId ID transaksi di database
     * @return bool
     */
    public static function sendOrderSignal(string $storeId, string $status, $transactionId): bool
    {
        $cleanStoreId = preg_replace('/[^a-zA-Z0-9-_]/', '', $storeId);
        $topic = 'store_' . $cleanStoreId;

        // Ambil data detail transaksi dari database
        $trx = Transaction::with(['items', 'tenant'])->find($transactionId);

        $tableNumber = $trx ? ($trx->table_number ?? 'Bungkus') : 'Meja -';
        $customerName = $trx ? ($trx->customer_name ?? 'Pelanggan') : 'Pelanggan';
        $totalAmount = $trx ? (float) $trx->total_amount : 0;
        $receiptNumber = $trx ? ($trx->receipt_number ?? "ONL-{$transactionId}") : "ONL-{$transactionId}";

        $itemsList = [];

        if ($trx && $trx->items) {
            foreach ($trx->items as $it) {
                $itemsList[] = [
                    'id' => $it->id,
                    'product_id' => $it->product_id,
                    'product_name' => $it->product_name ?? 'Item',
                    'quantity' => (int) $it->quantity,
                    'price' => (float) ($it->price ?? $it->unit_price ?? 0),
                    'subtotal' => (float) $it->subtotal,
                    'notes' => $it->notes,
                ];
            }
        }

        // Payload data sinyal lengkap
        $signalPayload = [
            'status' => strtoupper($status),
            'transaction_id' => (string) $transactionId,
            'receipt_number' => (string) $receiptNumber,
            'store_id' => $cleanStoreId,
            'table_number' => (string) $tableNumber,
            'customer_name' => (string) $customerName,
            'total_amount' => (string) $totalAmount,
            'items' => $itemsList,
            'timestamp' => (string) time(),
        ];

        // 1. 🔥 UTAMAKAN LOKAL DISPATCH (0ms) - Agar Mobile POS & Kasir Langsung Menerima Notifikasi Seketika
        cache()->put("latest_signal_{$topic}", array_merge($signalPayload, ['time' => microtime(true)]), 60);


        Log::info("[FirebaseSignal] Menyiapkan sinkronisasi ke Firebase (Topic: {$topic})", $signalPayload);

        $projectId = config('services.firebase.project_id', env('FIREBASE_PROJECT_ID', 'kilatz-8af68'));
        $credentialsPath = config('services.firebase.credentials_path', env('FIREBASE_CREDENTIALS_PATH'));
        $databaseUrl = config('services.firebase.database_url', env('FIREBASE_DATABASE_URL'));

        $token = null;
        if (!empty($credentialsPath) && file_exists(base_path($credentialsPath))) {
            $jsonKey = json_decode(file_get_contents(base_path($credentialsPath)), true);
            if ($jsonKey) {
                $token = self::getGoogleOAuth2Token($jsonKey);
            }
        }

        // 2. Kirim Notifikasi FCM v1 ke Topic Kasir (Non-blocking / Fast timeout)
        if ($token) {
            self::sendViaFCMv1($token, $projectId, $topic, $signalPayload);
        }

        // 3. Simpan ke Firebase Realtime Database
        $dbUrl = !empty($databaseUrl) ? rtrim($databaseUrl, '/') : "https://{$projectId}-default-rtdb.asia-southeast1.firebasedatabase.app";
        self::syncToRealtimeDB($token, $dbUrl, $cleanStoreId, $transactionId, $signalPayload, $trx);

        return true;
    }


    /**
     * Kirim notifikasi push via FCM HTTP v1 ke HP/Tablet Kasir
     */
    private static function sendViaFCMv1(string $token, string $projectId, string $topic, array $payload): bool
    {
        try {
            $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            $isPaid = $payload['status'] === 'PAID' || $payload['status'] === 'COMPLETED';
            $title = $isPaid ? '💰 Pembayaran QRIS Lunas!' : '🔔 Pesanan Online Baru Masuk!';
            $body = "{$payload['table_number']} • {$payload['customer_name']} (Rp" . number_format((float)$payload['total_amount'], 0, ',', '.') . ")";

            $msgPayload = [
                'message' => [
                    'topic' => $topic,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'data' => $payload,
                    'android' => [
                        'priority' => 'high',
                        'notification' => [
                            'sound' => 'default',
                            'channel_id' => 'orders',
                        ],
                    ],
                ],
            ];

            $res = Http::withToken($token)->post($endpoint, $msgPayload);

            if ($res->successful()) {
                Log::info("[FirebaseSignal] Sinyal FCM v1 sukses terkirim ke topic {$topic}");
                return true;
            } else {
                Log::warning("[FirebaseSignal] FCM v1 Error response: " . $res->body());
            }
        } catch (\Exception $e) {
            Log::error("[FirebaseSignal] FCM v1 Exception: " . $e->getMessage());
        }
        return false;
    }

    /**
     * Simpan data pesanan ke Cloud Firestore (Collection: orders)
     */
    private static function syncToFirestore(string $token, string $projectId, string $storeId, Transaction $trx): void
    {
        try {
            $docId = "order_{$trx->id}";
            $endpoint = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/orders/{$docId}";

            $itemsList = [];
            foreach ($trx->items as $it) {
                $itemsList[] = [
                    'mapValue' => [
                        'fields' => [
                            'product_name' => ['stringValue' => (string) $it->product_name],
                            'quantity' => ['integerValue' => (string) $it->quantity],
                            'price' => ['doubleValue' => (float) $it->unit_price],
                            'subtotal' => ['doubleValue' => (float) $it->subtotal],
                            'notes' => ['stringValue' => (string) ($it->notes ?? '')],
                        ],
                    ],
                ];
            }

            $firestoreDocument = [
                'fields' => [
                    'id' => ['integerValue' => (string) $trx->id],
                    'receipt_number' => ['stringValue' => (string) $trx->invoice_number],
                    'store_id' => ['stringValue' => (string) $storeId],
                    'table_number' => ['stringValue' => (string) ($trx->table_number ?? 'Bungkus')],
                    'customer_name' => ['stringValue' => (string) ($trx->customer_name ?? 'Pelanggan')],
                    'customer_phone' => ['stringValue' => (string) ($trx->customer_phone ?? '')],
                    'payment_type' => ['stringValue' => (string) $trx->payment_method],
                    'payment_status' => ['stringValue' => (string) $trx->payment_status],
                    'status' => ['stringValue' => (string) $trx->status],
                    'total_amount' => ['doubleValue' => (float) $trx->total_amount],
                    'items' => [
                        'arrayValue' => [
                            'values' => $itemsList,
                        ],
                    ],
                    'created_at' => ['stringValue' => $trx->created_at ? $trx->created_at->toIso8601String() : now()->toIso8601String()],
                ],
            ];

            $res = Http::withToken($token)->patch($endpoint, $firestoreDocument);
            if ($res->successful()) {
                Log::info("[FirebaseSignal] Data pesanan berhasil disimpan di Cloud Firestore: orders/{$docId}");
            } else {
                Log::warning("[FirebaseSignal] Firestore sync response: " . $res->body());
            }
        } catch (\Exception $e) {
            Log::warning("[FirebaseSignal] Firestore Exception: " . $e->getMessage());
        }
    }

    /**
     * Simpan data ke Firebase Realtime Database
     */
    private static function syncToRealtimeDB(?string $token, string $dbUrl, string $storeId, $transactionId, array $signalPayload, ?Transaction $trx): void
    {
        try {
            $dataToSave = $signalPayload;
            if ($trx) {
                $dataToSave['items'] = $trx->items->map(fn($it) => [
                    'product_name' => $it->product_name,
                    'quantity' => $it->quantity,
                    'price' => (float) $it->unit_price,
                    'subtotal' => (float) $it->subtotal,
                    'notes' => $it->notes,
                ])->toArray();
            }

            $url = "{$dbUrl}/orders/{$storeId}/{$transactionId}.json" . ($token ? "?auth={$token}" : '');
            $req = Http::timeout(4);
            if ($token) {
                $req = $req->withToken($token);
            }
            $res = $req->put($url, $dataToSave);

            if ($res->successful()) {
                Log::info("[FirebaseSignal] Realtime Database tersimpan di /orders/{$storeId}/{$transactionId}.json");
            }
        } catch (\Exception $e) {
            Log::warning("[FirebaseSignal] Realtime DB sync bypass: " . $e->getMessage());
        }
    }

    /**
     * Generate OAuth2 Access Token dari Google Service Account JSON
     */
    private static function getGoogleOAuth2Token(array $jsonKey): ?string
    {
        return cache()->remember('google_firebase_oauth_token', 3000, function () use ($jsonKey) {
            try {
                $now = time();
                $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
                $scopes = [
                    'https://www.googleapis.com/auth/firebase.messaging',
                    'https://www.googleapis.com/auth/datastore',
                    'https://www.googleapis.com/auth/firebase.database',
                    'https://www.googleapis.com/auth/userinfo.email',
                ];
                $claim = base64_encode(json_encode([
                    'iss' => $jsonKey['client_email'],
                    'scope' => implode(' ', $scopes),
                    'aud' => 'https://oauth2.googleapis.com/token',
                    'exp' => $now + 3600,
                    'iat' => $now,
                ]));

                $signature = '';
                openssl_sign("$header.$claim", $signature, $jsonKey['private_key'], 'SHA256');
                $jwt = "$header.$claim." . base64_encode($signature);

                $tokenRes = Http::timeout(3)->asForm()->post('https://oauth2.googleapis.com/token', [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion' => $jwt,
                ]);

                return $tokenRes->json('access_token');
            } catch (\Exception $e) {
                Log::error("[FirebaseSignal] Gagal membuat OAuth2 token: " . $e->getMessage());
                return null;
            }
        });
    }

}
