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
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
                'timestamp' => fn () => ($request->session()->has('success') || $request->session()->has('error') || $request->session()->has('info')) ? microtime(true) : null,
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
            'online_user_ids' => fn () => $request->user() ? \App\Models\User::getOnlineUserIds() : [],
            'system_limits' => [
                'upload_max_filesize' => ini_get('upload_max_filesize') ?: '2M',
                'post_max_size' => ini_get('post_max_size') ?: '8M',
                'max_upload_bytes' => (function () {
                    $parse = function ($val) {
                        $val = trim((string) $val);
                        if (empty($val)) return 8388608;
                        $last = strtolower(substr($val, -1));
                        $num = (float) $val;
                        switch ($last) {
                            case 'g': $num *= 1024 * 1024 * 1024; break;
                            case 'm': $num *= 1024 * 1024; break;
                            case 'k': $num *= 1024; break;
                        }
                        return (int) $num;
                    };
                    $post = $parse(ini_get('post_max_size') ?: '8M');
                    $upload = $parse(ini_get('upload_max_filesize') ?: '2M');
                    $appLimit = 2 * 1024 * 1024; // 2MB application limit
                    $effective = min($post, $upload, $appLimit);
                    return $effective;
                })(),
                'max_upload_mb' => (function () {
                    $parse = function ($val) {
                        $val = trim((string) $val);
                        if (empty($val)) return 8388608;
                        $last = strtolower(substr($val, -1));
                        $num = (float) $val;
                        switch ($last) {
                            case 'g': $num *= 1024 * 1024 * 1024; break;
                            case 'm': $num *= 1024 * 1024; break;
                            case 'k': $num *= 1024; break;
                        }
                        return (int) $num;
                    };
                    $post = $parse(ini_get('post_max_size') ?: '8M');
                    $upload = $parse(ini_get('upload_max_filesize') ?: '2M');
                    $effective = min($post, $upload, 2 * 1024 * 1024);
                    return round($effective / (1024 * 1024), 1);
                })(),
            ],
        ];
    }
}
