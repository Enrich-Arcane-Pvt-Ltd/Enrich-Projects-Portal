<?php

use App\Http\Controllers\DeveloperProjectController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        if (auth()->user()->isAdmin()) {
            return redirect('/admin');
        }
        return redirect()->route('dashboard');
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DeveloperProjectController::class, 'index'])->name('dashboard');

    // Developer Secret Vault Actions with Automated Audit Logging
    Route::prefix('developer')->name('developer.')->group(function () {
        Route::post('/reveal-secret/{credential}', [DeveloperProjectController::class, 'revealSecret'])->name('reveal-secret');
        Route::post('/reveal-account/{id}', [DeveloperProjectController::class, 'revealAccountPassword'])->name('reveal-account');
        Route::post('/reveal-client-credential/{id}', [DeveloperProjectController::class, 'revealClientCredential'])->name('reveal-client-credential');
        Route::post('/reveal-server/{id}', [DeveloperProjectController::class, 'revealServerSecret'])->name('reveal-server');
        Route::post('/log-copy', [DeveloperProjectController::class, 'logCopy'])->name('log-copy');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
