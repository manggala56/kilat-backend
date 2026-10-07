<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantGoogleDrive;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GoogleDriveStorageService
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $redirectUri;

    public function __construct()
    {
        $this->clientId = config('services.google_drive.client_id') ?? '';
        $this->clientSecret = config('services.google_drive.client_secret') ?? '';
        $this->redirectUri = config('services.google_drive.redirect_uri') ?? (url('/settings/google-drive/callback'));
    }

    /**
     * Generate OAuth URL for Google Drive authorization
     */
    public function getAuthUrl(int $tenantId): string
    {
        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
            'access_type' => 'offline',
            'prompt' => 'consent select_account',
            'state' => json_encode(['tenant_id' => $tenantId]),
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /**
     * Exchange authorization code for tokens
     */
    public function handleCallback(string $code): ?array
    {
        try {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'redirect_uri' => $this->redirectUri,
                'grant_type' => 'authorization_code',
            ]);

            if (!$response->successful()) {
                Log::error('Google Drive OAuth Token Exchange Failed', ['body' => $response->body()]);
                return null;
            }

            $tokens = $response->json();
            $accessToken = $tokens['access_token'] ?? null;
            $refreshToken = $tokens['refresh_token'] ?? null;
            $expiresIn = $tokens['expires_in'] ?? 3600;

            // Fetch user email
            $email = null;
            if ($accessToken) {
                $userResponse = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v2/userinfo');
                if ($userResponse->successful()) {
                    $email = $userResponse->json('email');
                }
            }

            return [
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_at' => now()->addSeconds($expiresIn),
                'email' => $email,
            ];
        } catch (\Throwable $e) {
            Log::error('Google Drive Callback Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Refresh access token for a tenant if expired
     */
    public function refreshAccessToken(TenantGoogleDrive $drive): ?string
    {
        if (!$drive->refresh_token) {
            return null;
        }

        try {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'refresh_token' => $drive->refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $drive->update([
                    'access_token' => $data['access_token'],
                    'token_expires_at' => now()->addSeconds($data['expires_in'] ?? 3600),
                ]);
                return $data['access_token'];
            }

            Log::error('Failed to refresh Google Drive token', ['body' => $response->body()]);
        } catch (\Throwable $e) {
            Log::error('Exception refreshing Google Drive token: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Get valid access token
     */
    public function getValidToken(TenantGoogleDrive $drive): ?string
    {
        if ($drive->access_token && $drive->token_expires_at && $drive->token_expires_at->isFuture()) {
            return $drive->access_token;
        }

        return $this->refreshAccessToken($drive);
    }

    /**
     * Get or create folder 'Kilatz POS - Produk' in merchant's Google Drive
     */
    public function ensureProductFolder(TenantGoogleDrive $drive): ?string
    {
        $token = $this->getValidToken($drive);
        if (!$token) {
            return null;
        }

        if ($drive->folder_id) {
            return $drive->folder_id;
        }

        // Search for existing folder
        $query = "mimeType = 'application/vnd.google-apps.folder' and name = 'Kilatz POS - Produk' and trashed = false";
        $response = Http::withToken($token)->get('https://www.googleapis.com/drive/v3/files', [
            'q' => $query,
            'fields' => 'files(id, name)',
        ]);

        if ($response->successful()) {
            $files = $response->json('files');
            if (!empty($files) && isset($files[0]['id'])) {
                $folderId = $files[0]['id'];
                $drive->update(['folder_id' => $folderId]);
                return $folderId;
            }
        }

        // Create new folder
        $createResponse = Http::withToken($token)->post('https://www.googleapis.com/drive/v3/files', [
            'name' => 'Kilatz POS - Produk',
            'mimeType' => 'application/vnd.google-apps.folder',
        ]);

        if ($createResponse->successful()) {
            $folderId = $createResponse->json('id');
            $drive->update(['folder_id' => $folderId]);
            return $folderId;
        }

        return null;
    }

    /**
     * Compress an image to WebP with max dimension and quality
     * Returns array with 'path' (temporary file path), 'mime', and 'filename'
     */
    public function compressImage(UploadedFile $file, int $maxDimension = 800, int $quality = 80): ?string
    {
        $sourcePath = $file->getRealPath();
        $mime = $file->getMimeType();

        // Create image from source based on mime type
        $image = null;
        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = @imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $image = @imagecreatefrompng($sourcePath);
                break;
            case 'image/webp':
                $image = @imagecreatefromwebp($sourcePath);
                break;
            default:
                $content = @file_get_contents($sourcePath);
                if ($content) {
                    $image = @imagecreatefromstring($content);
                }
                break;
        }

        if (!$image) {
            return null;
        }

        $width = imagesx($image);
        $height = imagesy($image);

        // Calculate proportional dimensions
        if ($width > $maxDimension || $height > $maxDimension) {
            if ($width >= $height) {
                $newWidth = $maxDimension;
                $newHeight = (int) round(($height / $width) * $maxDimension);
            } else {
                $newHeight = $maxDimension;
                $newWidth = (int) round(($width / $height) * $maxDimension);
            }

            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            // Handle transparency for PNG/WebP
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);

            imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resizedImage;
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'kilatz_img_') . '.webp';
        imagewebp($image, $tempPath, $quality);
        imagedestroy($image);

        return $tempPath;
    }

    /**
     * Upload product photo: compresses to WebP, uploads to merchant Google Drive if connected,
     * otherwise falls back to local storage.
     * Returns the public image URL.
     */
    public function uploadProductPhoto(Tenant $tenant, UploadedFile $file): ?string
    {
        // 1. Compress image to WebP
        $compressedPath = $this->compressImage($file, 800, 80);
        $fileToUpload = $compressedPath ?: $file->getRealPath();
        $filename = 'product_' . time() . '_' . uniqid() . '.webp';

        // 2. Check if Tenant has Google Drive connected
        $drive = TenantGoogleDrive::where('tenant_id', $tenant->id)->where('is_connected', true)->first();

        if ($drive) {
            $token = $this->getValidToken($drive);
            $folderId = $this->ensureProductFolder($drive);

            if ($token) {
                try {
                    $metadata = [
                        'name' => $filename,
                    ];
                    if ($folderId) {
                        $metadata['parents'] = [$folderId];
                    }

                    $fileContent = file_get_contents($fileToUpload);

                    // Multipart upload to Google Drive
                    $response = Http::withToken($token)
                        ->attach('metadata', json_encode($metadata), 'metadata.json', ['Content-Type' => 'application/json; charset=UTF-8'])
                        ->attach('file', $fileContent, $filename, ['Content-Type' => 'image/webp'])
                        ->post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink,webViewLink');

                    if ($response->successful()) {
                        $fileId = $response->json('id');

                        // Set permission so image can be accessed publicly via CDN
                        Http::withToken($token)->post("https://www.googleapis.com/drive/v3/files/{$fileId}/permissions", [
                            'role' => 'reader',
                            'type' => 'anyone',
                        ]);

                        if ($compressedPath && file_exists($compressedPath)) {
                            @unlink($compressedPath);
                        }

                        // Return high-performance Google User Content CDN URL
                        return "https://lh3.googleusercontent.com/d/{$fileId}";
                    }

                    Log::warning('Google Drive Upload API returned error: ' . $response->body());
                } catch (\Throwable $e) {
                    Log::error('Google Drive Upload Exception: ' . $e->getMessage());
                }
            }
        }

        // 3. Fallback to Local Public Storage if Google Drive is not connected or upload failed
        try {
            $path = 'products/' . $filename;
            Storage::disk('public')->put($path, file_get_contents($fileToUpload));
            
            if ($compressedPath && file_exists($compressedPath)) {
                @unlink($compressedPath);
            }

            return Storage::disk('public')->url($path);
        } catch (\Throwable $e) {
            Log::error('Local Image Storage Exception: ' . $e->getMessage());
            if ($compressedPath && file_exists($compressedPath)) {
                @unlink($compressedPath);
            }
            return null;
        }
    }
}
