<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get paginated notifications for current user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->paginate(20)
            ->through(function ($n) {
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
            });

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark single notification as read
     */
    public function markAsRead(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();

        if ($notification && is_null($notification->read_at)) {
            $notification->markAsRead();
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ]);
        }

        return redirect()->back();
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): RedirectResponse|JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'unread_count' => 0,
            ]);
        }

        return redirect()->back();
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $request->user()->notifications()->where('id', $id)->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ]);
        }

        return redirect()->back();
    }

    /**
     * Delete all notifications for current user
     */
    public function deleteAll(Request $request): RedirectResponse|JsonResponse
    {
        $request->user()->notifications()->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'unread_count' => 0,
            ]);
        }

        return redirect()->back();
    }

    /**
     * Delete multiple selected notifications
     */
    public function destroyBulk(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'string',
        ]);

        $request->user()->notifications()->whereIn('id', $validated['ids'])->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ]);
        }

        return redirect()->back();
    }
}
