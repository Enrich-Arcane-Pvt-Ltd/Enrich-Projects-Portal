<?php

use App\Http\Controllers\DeveloperProjectController;
use App\Http\Controllers\ProjectManagementController;
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

        // Project Management (Developer is main controller)
        Route::post('/projects', [ProjectManagementController::class, 'storeProject'])->name('projects.store');
        Route::put('/projects/{project}', [ProjectManagementController::class, 'updateProject'])->name('projects.update');
        Route::delete('/projects/{project}', [ProjectManagementController::class, 'deleteProject'])->name('projects.destroy');

        // Sub-entities
        Route::post('/projects/{project}/credentials', [ProjectManagementController::class, 'storeCredential'])->name('credentials.store');
        Route::put('/projects/{project}/credentials/{credential}', [ProjectManagementController::class, 'updateCredential'])->name('credentials.update');
        Route::delete('/projects/{project}/credentials/{credential}', [ProjectManagementController::class, 'deleteCredential'])->name('credentials.destroy');

        Route::post('/projects/{project}/client-credentials', [ProjectManagementController::class, 'storeClientCredential'])->name('client-credentials.store');
        Route::put('/projects/{project}/client-credentials/{credential}', [ProjectManagementController::class, 'updateClientCredential'])->name('client-credentials.update');
        Route::delete('/projects/{project}/client-credentials/{credential}', [ProjectManagementController::class, 'deleteClientCredential'])->name('client-credentials.destroy');

        Route::post('/projects/{project}/links', [ProjectManagementController::class, 'storeLink'])->name('links.store');
        Route::put('/projects/{project}/links/{link}', [ProjectManagementController::class, 'updateLink'])->name('links.update');
        Route::delete('/projects/{project}/links/{link}', [ProjectManagementController::class, 'deleteLink'])->name('links.destroy');

        Route::post('/projects/{project}/servers', [ProjectManagementController::class, 'storeServer'])->name('servers.store');
        Route::put('/projects/{project}/servers/{server}', [ProjectManagementController::class, 'updateServer'])->name('servers.update');
        Route::delete('/projects/{project}/servers/{server}', [ProjectManagementController::class, 'deleteServer'])->name('servers.destroy');

        Route::post('/projects/{project}/accounts', [ProjectManagementController::class, 'storeThirdPartyAccount'])->name('accounts.store');
        Route::put('/projects/{project}/accounts/{account}', [ProjectManagementController::class, 'updateThirdPartyAccount'])->name('accounts.update');
        Route::delete('/projects/{project}/accounts/{account}', [ProjectManagementController::class, 'deleteThirdPartyAccount'])->name('accounts.destroy');

        Route::post('/projects/{project}/services', [ProjectManagementController::class, 'storeBackgroundService'])->name('services.store');
        Route::put('/projects/{project}/services/{service}', [ProjectManagementController::class, 'updateBackgroundService'])->name('services.update');
        Route::delete('/projects/{project}/services/{service}', [ProjectManagementController::class, 'deleteBackgroundService'])->name('services.destroy');

        Route::post('/projects/{project}/iot', [ProjectManagementController::class, 'storeIotConfiguration'])->name('iot.store');
        Route::put('/projects/{project}/iot/{iot}', [ProjectManagementController::class, 'updateIotConfiguration'])->name('iot.update');
        Route::delete('/projects/{project}/iot/{iot}', [ProjectManagementController::class, 'deleteIotConfiguration'])->name('iot.destroy');

        Route::post('/projects/{project}/documents', [ProjectManagementController::class, 'storeDocument'])->name('documents.store');
        Route::delete('/projects/{project}/documents/{document}', [ProjectManagementController::class, 'deleteDocument'])->name('documents.destroy');

        // Developer Assignments & Team Management
        Route::post('/projects/{project}/assign-developer', [ProjectManagementController::class, 'assignDeveloper'])->name('developers.assign');
        Route::delete('/projects/{project}/unassign-developer/{user}', [ProjectManagementController::class, 'unassignDeveloper'])->name('developers.unassign');
        Route::post('/projects/{project}/update-leads', [ProjectManagementController::class, 'updateLeads'])->name('developers.update-leads');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
