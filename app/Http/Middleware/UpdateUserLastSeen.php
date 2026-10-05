<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class UpdateUserLastSeen
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('user-offline*')) {
            return $next($request);
        }

        if (Auth::check()) {
            $user = Auth::user();
            $now = time();

            // 1. Maintain active users map in Cache (works across all session drivers & hosting setups)
            try {
                $activeUsers = Cache::get('active_portal_user_ids', []);
                if (! is_array($activeUsers)) {
                    $activeUsers = [];
                }

                $activeUsers[$user->id] = $now;

                // Prune entries older than 75 seconds
                $threshold = $now - 75;
                $activeUsers = array_filter($activeUsers, fn ($time) => is_numeric($time) && $time >= $threshold);

                Cache::put('active_portal_user_ids', $activeUsers, now()->addMinutes(15));
            } catch (\Throwable $e) {
                // Ignore cache failures
            }

            // 2. Update last_seen_at in users table if column exists (throttled to once every 20s)
            try {
                if (Schema::hasColumn('users', 'last_seen_at')) {
                    $lastSeen = $user->last_seen_at ? $user->last_seen_at->timestamp : 0;
                    if ($now - $lastSeen >= 20) {
                        $user->timestamps = false;
                        $user->last_seen_at = now();
                        $user->saveQuietly();
                    }
                }
            } catch (\Throwable $e) {
                // Ignore DB update failures
            }
        }

        return $next($request);
    }
}
