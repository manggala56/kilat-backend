<?php

namespace Tests\Unit;

use App\Services\Payment\DokuSignatureService;
use PHPUnit\Framework\TestCase;

class DokuSignatureTest extends TestCase
{
    public function test_digest_generation()
    {
        $body = '{"order":{"invoice_number":"INV-123","amount":50000}}';
        $digest = DokuSignatureService::generateDigest($body);

        $expectedDigest = base64_encode(hash('sha256', $body, true));
        $this->assertEquals($expectedDigest, $digest);
    }

    public function test_signature_generation_and_verification()
    {
        $clientId = 'MOCK-CLIENT-001';
        $requestId = 'req-12345';
        $timestamp = '2026-10-07T07:00:00Z';
        $target = '/api/v1/payments/doku/notifications';
        $body = '{"transaction":{"status":"SUCCESS"},"order":{"invoice_number":"KLTZ-T1-10-12345"}}';
        $secretKey = 'my-super-secret-key';

        $signature = DokuSignatureService::generateSignature(
            $clientId,
            $requestId,
            $timestamp,
            $target,
            $body,
            $secretKey
        );

        $this->assertStringStartsWith('HMACSHA256=', $signature);

        // Verification with valid data
        $isValid = DokuSignatureService::verifySignature(
            $signature,
            $clientId,
            $requestId,
            $timestamp,
            $target,
            $body,
            $secretKey
        );
        $this->assertTrue($isValid);

        // Verification with altered body
        $isTamperedValid = DokuSignatureService::verifySignature(
            $signature,
            $clientId,
            $requestId,
            $timestamp,
            $target,
            '{"transaction":{"status":"SUCCESS"},"order":{"invoice_number":"KLTZ-T1-10-TAMPERED"}}',
            $secretKey
        );
        $this->assertFalse($isTamperedValid);

        // Verification with invalid secret
        $isWrongSecretValid = DokuSignatureService::verifySignature(
            $signature,
            $clientId,
            $requestId,
            $timestamp,
            $target,
            $body,
            'wrong-secret-key'
        );
        $this->assertFalse($isWrongSecretValid);
    }
}
