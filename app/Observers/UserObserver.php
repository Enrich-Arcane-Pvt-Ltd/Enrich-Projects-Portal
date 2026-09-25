<?php

namespace App\Observers;

use App\Models\User;
use App\Services\PortalNotificationService;
use Illuminate\Support\Facades\Auth;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        $actor = Auth::user();
        PortalNotificationService::notifyUserAdded($user, $actor);
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $actor = Auth::user();
        PortalNotificationService::notifyUserDeleted($user->name, $user->role, $actor);
    }
}
