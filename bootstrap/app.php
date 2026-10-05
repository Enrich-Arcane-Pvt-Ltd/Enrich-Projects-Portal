<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\UpdateUserLastSeen::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'user-offline',
            'user-offline/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Http\Exceptions\PostTooLargeException $e, \Illuminate\Http\Request $request) {
            $postLimit = ini_get('post_max_size') ?: '8M';
            $message = "The uploaded file exceeds the server post limit ({$postLimit}). Please use the External Link (Google Drive) option or increase post_max_size in php.ini.";

            return redirect()->back()->withErrors([
                'file' => $message,
            ]);
        });
    })->create();
