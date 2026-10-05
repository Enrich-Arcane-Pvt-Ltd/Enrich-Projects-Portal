<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \Filament\Auth\Http\Responses\Contracts\LogoutResponse::class,
            function () {
                return new class implements \Filament\Auth\Http\Responses\Contracts\LogoutResponse {
                    public function toResponse($request): \Illuminate\Http\RedirectResponse
                    {
                        if ($user = $request->user()) {
                            \App\Models\User::markUserOffline($user->id);
                        }
                        return redirect()->route('login');
                    }
                };
            }
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        \App\Models\User::observe(\App\Observers\UserObserver::class);

        Event::listen(\Illuminate\Auth\Events\Logout::class, function ($event) {
            if ($event->user) {
                \App\Models\User::markUserOffline($event->user->id);
            }
        });
    }
}
