<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class DeviceAuthController extends Controller
{
    /**
     * POST /api/v2/device/verify-owner
     * Sesi 1: Validasi email & password akun owner, lalu kembalikan daftar outlet & batas paket.
     */
    public function verifyOwner(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required'    => 'Email pemilik wajib diisi.',
            'password.required' => 'Password pemilik wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data tidak valid.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $owner = User::where('email', $request->email)->first();

        if (! $owner || ! Hash::check($request->password, $owner->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Email atau password pemilik salah.',
            ], 401);
        }

        // Ambil semua outlet aktif milik owner beserta subscriptionPackage dan devices aktif
        $tenants = Tenant::where('owner_id', $owner->id)
            ->where('status', 'active')
            ->with(['subscriptionPackage', 'devices' => function ($q) {
                $q->where('status', 'active');
            }])
            ->get();

        if ($tenants->isEmpty()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tidak ada toko / outlet aktif yang terdaftar pada akun pemilik ini.',
            ], 404);
        }

        $outlets = $tenants->map(function ($t) {
            $maxDevices = $t->subscriptionPackage?->max_devices_per_outlet ?? 2;
            $activeDevicesCount = $t->devices->count();
            return [
                'id'                   => $t->id,
                'store_id'             => $t->store_id,
                'business_name'        => $t->business_name,
                'business_address'     => $t->business_address,
                'active_devices_count' => $activeDevicesCount,
                'max_devices'          => $maxDevices,
                'can_pair'             => $activeDevicesCount < $maxDevices,
                'package_name'         => $t->subscriptionPackage?->name ?? 'Standar',
            ];
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Kredensial pemilik terverifikasi.',
            'owner'   => [
                'id'    => $owner->id,
                'name'  => $owner->name,
                'email' => $owner->email,
            ],
            'outlets' => $outlets,
        ], 200);
    }

    /**
     * POST /api/v2/device/activate
     * Sesi 2: Aktivasi / pairing perangkat POS menggunakan Email, Password Owner, dan Outlet terpilih.
     */
    public function activate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'        => 'required|email',
            'password'     => 'required|string',
            'device_id'    => 'required|string',
            'device_name'  => 'nullable|string',
            'device_model' => 'nullable|string',
            'device_os'    => 'nullable|string',
            'app_version'  => 'nullable|string',
            'outlet_id'    => 'required|integer',
        ], [
            'email.required'     => 'Email pemilik wajib diisi.',
            'password.required'  => 'Password pemilik wajib diisi.',
            'device_id.required' => 'Device ID hardware wajib disertakan.',
            'outlet_id.required' => 'Outlet wajib dipilih.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data aktivasi tidak valid.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // 1. Validasi Akun Owner
        $owner = User::where('email', $request->email)->first();

        if (! $owner || ! Hash::check($request->password, $owner->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Email atau password pemilik salah.',
            ], 401);
        }

        // 2. Dapatkan Tenant / Outlet yang terikat ke Owner
        $tenant = Tenant::where('owner_id', $owner->id)
            ->where('id', $request->outlet_id)
            ->where('status', 'active')
            ->with('subscriptionPackage')
            ->first();

        if (! $tenant) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Toko / Outlet aktif tidak ditemukan untuk akun pemilik ini.',
            ], 404);
        }

        // 3. Validasi Batas Kuota Perangkat (Device Limit) Sesuai Paket
        $maxDevices = $tenant->subscriptionPackage?->max_devices_per_outlet ?? 2;
        $activeDevicesCount = Device::where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->where('device_id', '!=', $request->device_id)
            ->count();

        if ($activeDevicesCount >= $maxDevices) {
            return response()->json([
                'status'  => 'error',
                'message' => "Batas perangkat tercapai ({$maxDevices} perangkat) untuk outlet \"{$tenant->business_name}\". Harap putuskan perangkat lain melalui Web Dashboard.",
            ], 422);
        }

        // 4. Daftarkan / Perbarui Perangkat POS
        $device = Device::updateOrCreate(
            ['device_id' => $request->device_id],
            [
                'tenant_id'      => $tenant->id,
                'outlet_id'      => $tenant->id,
                'device_name'    => $request->device_name ?: 'POS Device ' . substr($request->device_id, 0, 6),
                'device_model'   => $request->device_model,
                'device_os'      => $request->device_os,
                'app_version'    => $request->app_version,
                'status'         => 'active',
                'paired_at'      => now(),
                'last_active_at' => now(),
            ]
        );

        // 5. Buat Sanctum Token Jangka Panjang untuk Perangkat
        $device->tokens()->delete(); // Hapus token lama jika pairing ulang
        $deviceToken = $device->createToken('device_' . $device->device_id)->plainTextToken;

        // 6. Ambil Seluruh Data Karyawan / Kasir Aktif untuk Disinkronkan ke SQLite Lokal POS
        $employees = Employee::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'status'        => 'success',
            'message'       => 'Perangkat POS berhasil diaktivasi.',
            'access_token'  => $deviceToken,
            'token_type'    => 'Bearer',
            'device'        => [
                'id'          => $device->id,
                'device_id'   => $device->device_id,
                'device_name' => $device->device_name,
                'status'      => $device->status,
            ],
            'tenant'        => [
                'id'               => $tenant->id,
                'store_id'         => $tenant->store_id,
                'business_name'    => $tenant->business_name,
                'business_address' => $tenant->business_address,
            ],
            'employees'     => $employees->map(function ($emp) {
                return [
                    'id'        => $emp->id,
                    'name'      => $emp->name,
                    'username'  => $emp->username,
                    'role'      => $emp->role,
                    'is_active' => $emp->is_active,
                ];
            }),
        ], 200);
    }

    /**
     * GET /api/v2/device/staff
     * Ambil data staf kasir terbaru untuk sinkronisasi lokal.
     */
    public function syncStaff(Request $request)
    {
        $tenant = app('tenant');

        $employees = Employee::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $employees->map(function ($emp) {
                return [
                    'id'        => $emp->id,
                    'name'      => $emp->name,
                    'username'  => $emp->username,
                    'role'      => $emp->role,
                    'is_active' => $emp->is_active,
                ];
            }),
        ]);
    }

    /**
     * GET /api/v2/device/info
     * Mendapatkan info status perangkat POS saat ini.
     */
    public function info(Request $request)
    {
        $device = $request->user();
        $tenant = app('tenant');

        if ($device instanceof Device) {
            if ($device->status === 'revoked') {
                return response()->json([
                    'status'  => 'revoked',
                    'message' => 'Perangkat ini telah diputuskan oleh Pemilik melalui Web Dashboard.',
                ], 401);
            }
            $device->update(['last_active_at' => now()]);
        }

        return response()->json([
            'status' => 'success',
            'device' => $device,
            'tenant' => [
                'id'               => $tenant->id,
                'store_id'         => $tenant->store_id,
                'business_name'    => $tenant->business_name,
                'business_address' => $tenant->business_address,
            ],
        ]);
    }

    /**
     * POST /api/v2/device/deactivate
     * Memutuskan pairing perangkat POS (Unlink device).
     */
    public function deactivate(Request $request)
    {
        $device = $request->user();

        if ($device instanceof Device) {
            $device->update(['status' => 'revoked']);
            $device->tokens()->delete();
        } elseif ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Perangkat berhasil diputuskan (deactivated).',
        ]);
    }

    /**
     * POST /api/v2/cashier/login
     * Verifikasi / notifikasi pembukaan sesi kasir online.
     */
    public function cashierLogin(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'pin_code' => 'required|string',
        ]);

        $tenant = app('tenant');

        $employee = Employee::where('tenant_id', $tenant->id)
            ->where('username', $request->username)
            ->where('is_active', true)
            ->first();

        if (! $employee || ! Hash::check($request->pin_code, $employee->pin_code)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Username atau PIN kasir tidak valid.',
            ], 401);
        }

        return response()->json([
            'status'   => 'success',
            'message'  => 'Login kasir berhasil.',
            'employee' => [
                'id'        => $employee->id,
                'name'      => $employee->name,
                'username'  => $employee->username,
                'role'      => $employee->role,
                'tenant_id' => $employee->tenant_id,
                'outlet_id' => $employee->outlet_id,
            ],
        ]);
    }
}
