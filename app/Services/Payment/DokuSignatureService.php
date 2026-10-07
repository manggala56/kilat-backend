<?php

namespace App\Services\Payment;

class DokuSignatureService
{
    /**
     * Generate standard DOKU SHA-256 Digest from request body.
     */
    public static function generateDigest(string $body): string
    {
        return base64_encode(hash('sha256', $body, true));
    }

    /**
     * Generate HMAC-SHA256 Signature for DOKU Direct API / Notification.
     *
     * Component format:
     * Client-Id:{clientId}\nRequest-Id:{requestId}\nRequest-Timestamp:{requestTimestamp}\nRequest-Target:{requestTarget}\nDigest:{digest}
     */
    public static function generateSignature(
        string $clientId,
        string $requestId,
        string $requestTimestamp,
        string $requestTarget,
        string $body,
        ?string $secretKey = null
    ): string {
        $secretKey = $secretKey ?: config('doku.secret_key', '');
        $digest = self::generateDigest($body);

        $component = "Client-Id:" . $clientId . "\n" .
                     "Request-Id:" . $requestId . "\n" .
                     "Request-Timestamp:" . $requestTimestamp . "\n" .
                     "Request-Target:" . $requestTarget . "\n" .
                     "Digest:" . $digest;

        $signatureRaw = base64_encode(hash_hmac('sha256', $component, $secretKey, true));

        return "HMACSHA256=" . $signatureRaw;
    }

    /**
     * Verify incoming Webhook Notification signature from DOKU.
     */
    public static function verifySignature(
        string $incomingSignature,
        string $clientId,
        string $requestId,
        string $requestTimestamp,
        string $requestTarget,
        string $rawBody,
        ?string $secretKey = null
    ): bool {
        $expectedSignature = self::generateSignature(
            $clientId,
            $requestId,
            $requestTimestamp,
            $requestTarget,
            $rawBody,
            $secretKey
        );

        // Normalize comparison (handles with or without HMACSHA256= prefix)
        $cleanIncoming = str_replace('HMACSHA256=', '', trim($incomingSignature));
        $cleanExpected = str_replace('HMACSHA256=', '', trim($expectedSignature));

        return hash_equals($cleanExpected, $cleanIncoming);
    }
}
