<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    // Google Drive Integration
    Route::get('settings/google-drive', [\App\Http\Controllers\Settings\GoogleDriveController::class, 'show'])->name('settings.google-drive');
    Route::get('settings/google-drive/auth', [\App\Http\Controllers\Settings\GoogleDriveController::class, 'redirect'])->name('settings.google-drive.auth');
    Route::get('settings/google-drive/callback', [\App\Http\Controllers\Settings\GoogleDriveController::class, 'callback'])->name('settings.google-drive.callback');
    Route::post('settings/google-drive/disconnect', [\App\Http\Controllers\Settings\GoogleDriveController::class, 'disconnect'])->name('settings.google-drive.disconnect');
});
