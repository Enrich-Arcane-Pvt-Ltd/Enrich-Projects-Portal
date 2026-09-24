<?php

namespace App\Http\Middleware;

use Filament\Facades\Filament;
use Filament\Http\Middleware\Authenticate as BaseAuthenticate;
use Filament\Models\Contracts\FilamentUser;

class FilamentAuthenticate extends BaseAuthenticate
{
    /**
     * Authenticate the user for the Filament admin panel.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  array<string>  $guards
     */
    protected function authenticate($request, array $guards): void
    {
        $guard = Filament::auth();

        if (! $guard->check()) {
            $this->unauthenticated($request, $guards);

            return;
        }

        $this->auth->shouldUse(Filament::getAuthGuard());

        $user = $guard->user();

        $panel = Filament::getCurrentOrDefaultPanel();

        // If the user lacks access to the Filament panel (e.g. developer role),
        // redirect them safely to their developer dashboard instead of a 403 error.
        if ($user instanceof FilamentUser && ! $user->canAccessPanel($panel)) {
            abort(redirect()->route('dashboard'));
        }
    }

    /**
     * Redirect unauthenticated requests to the central PIMS login page.
     *
     * @param  \Illuminate\Http\Request  $request
     */
    protected function redirectTo($request): ?string
    {
        return route('login');
    }
}
