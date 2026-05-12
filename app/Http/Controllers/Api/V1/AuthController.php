<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/v1/login
     * Login employee dengan username + PIN + outlet_id.
     */
    public function login(Request $request)
    {
        $request->validate([
            'login_type'   => 'required|string|in:employee',
            'username'     => 'required|string',
            'pin_code'     => 'required|string|min:4|max:6',
            'outlet_id'    => 'nullable|integer',
            'device_id'    => 'required|string',
            'device_model' => 'nullable|string',
            'device_os'    => 'nullable|string',
        ]);

        // Cari employee berdasarkan username & outlet_id
        $query = Employee::where('username', $request->username)
            ->where('is_active', true);

        if ($request->outlet_id) {
            $query->where('outlet_id', $request->outlet_id);
        }

        $employee = $query->first();

        if (! $employee || ! Hash::check($request->pin_code, $employee->pin_code)) {
            return response()->json([
                'message' => 'Username atau PIN salah.',
            ], 401);
        }

        // Revoke token lama (optional: bisa multi-device)
        $employee->tokens()->where('name', $request->device_id)->delete();

        // Buat token baru
        $token = $employee->createToken($request->device_id)->plainTextToken;

        return response()->json([
            'access_token'  => $token,
            'refresh_token' => null, // Sanctum stateless — tidak pakai refresh token
            'token_type'    => 'Bearer',
            'expires_in'    => 3600,
            'employee'      => [
                'id'        => $employee->id,
                'name'      => $employee->name,
                'tenant_id' => $employee->tenant_id,
                'outlet_id' => $employee->outlet_id,
            ],
            'tenant_id' => $employee->tenant_id,
            'outlet_id' => $employee->outlet_id,
            'role'      => $employee->role,
        ]);
    }

    /**
     * POST /api/v1/register
     * Daftarkan employee baru (tidak perlu auth).
     */
    public function register(Request $request)
    {
        $request->validate([
            'outlet_id'    => 'required|integer',
            'name'         => 'required|string|min:2',
            'username'     => [
                'required',
                'string',
                'min:3',
                'regex:/^[a-z0-9_]+$/',
                // Unik per outlet_id
                \Illuminate\Validation\Rule::unique('employees')->where(function ($q) use ($request) {
                    return $q->where('outlet_id', $request->outlet_id);
                }),
            ],
            'pin_code'     => 'required|string|digits_between:4,6',
            'role'         => 'required|string|in:CASHIER,SUPERVISOR,OWNER',
            'device_id'    => 'nullable|string',
            'device_model' => 'nullable|string',
            'device_os'    => 'nullable|string',
        ], [
            'username.regex'         => 'Username hanya boleh huruf kecil, angka, dan underscore.',
            'username.unique'        => 'Username sudah digunakan di outlet ini.',
            'pin_code.digits_between'=> 'PIN harus 4-6 digit numerik.',
        ]);

        // outlet_id di sini = tenant_id (simplifikasi — 1 outlet = 1 tenant)
        // Validasi tenant ada
        $tenant = Tenant::find($request->outlet_id);
        if (! $tenant) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => ['outlet_id' => ['Outlet tidak ditemukan.']],
            ], 422);
        }

        Employee::create([
            'tenant_id' => $request->outlet_id,
            'outlet_id' => $request->outlet_id,
            'name'      => $request->name,
            'username'  => $request->username,
            'pin_code'  => Hash::make($request->pin_code),
            'role'      => $request->role,
        ]);

        return response()->json([
            'message' => 'Akun berhasil dibuat. Silakan login.',
        ], 201);
    }

    /**
     * POST /api/v1/logout
     * Revoke token saat ini.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
