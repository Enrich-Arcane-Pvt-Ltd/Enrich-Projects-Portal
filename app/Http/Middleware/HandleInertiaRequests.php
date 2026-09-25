<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => fn () => $request->user() ? [
                'unread_count' => $request->user()->unreadNotifications()->count(),
                'recent' => $request->user()->notifications()
                    ->latest()
                    ->limit(20)
                    ->get()
                    ->map(function ($n) {
                        return [
                            'id' => $n->id,
                            'title' => $n->data['title'] ?? 'Notification',
                            'body' => $n->data['body'] ?? '',
                            'status' => $n->data['status'] ?? 'info',
                            'icon' => $n->data['icon'] ?? 'heroicon-o-bell',
                            'actions' => $n->data['actions'] ?? [],
                            'read_at' => $n->read_at ? $n->read_at->toIso8601String() : null,
                            'created_at' => $n->created_at->diffForHumans(),
                            'created_at_raw' => $n->created_at->toIso8601String(),
                        ];
                    }),
            ] : null,
        ];
    }
}
