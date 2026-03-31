<?php

namespace App\Http\Controllers;

use App\Models\AdminItNotification;
use App\Services\AdminItNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AdminItNotificationController extends Controller
{
    public function __construct(
        private readonly AdminItNotificationService $adminItNotificationService,
    ) {
    }

    public function index(): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'admin_it') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $this->adminItNotificationService->syncDueSoonNotificationsForUser($user);

        $notifications = AdminItNotification::query()
            ->with('bugTicket')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $unreadNotifications = $notifications
            ->filter(fn (AdminItNotification $notification) => !$notification->read_at)
            ->values();
        $historyNotifications = $notifications
            ->filter(fn (AdminItNotification $notification) => (bool) $notification->read_at)
            ->values();

        return response()->json([
            'unread_notifications' => $unreadNotifications
                ->map(fn (AdminItNotification $notification) => $this->serializeNotification($notification))
                ->values(),
            'history_notifications' => $historyNotifications
                ->map(fn (AdminItNotification $notification) => $this->serializeNotification($notification))
                ->values(),
            'unread_count' => $unreadNotifications->count(),
            'total_count' => $notifications->count(),
        ]);
    }

    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'admin_it') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $this->adminItNotificationService->syncDueSoonNotificationsForUser($user);

        $unreadCount = AdminItNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(AdminItNotification $notification): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'admin_it' || (int) $notification->user_id !== (int) $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        if (!$notification->read_at) {
            $notification->update([
                'read_at' => now()->utc(),
            ]);
        }

        $notification->load('bugTicket');

        $unreadCount = AdminItNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'notification' => $this->serializeNotification($notification),
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'admin_it') {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $timestamp = now()->utc();

        AdminItNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

        return response()->json([
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
            'unread_count' => 0,
        ]);
    }

    private function serializeNotification(AdminItNotification $notification): array
    {
        $ticket = $notification->bugTicket;

        return [
            'id' => (int) $notification->id,
            'type' => $notification->type,
            'type_label' => $this->adminItNotificationService->getTypeLabel($notification->type),
            'title' => $notification->title,
            'message' => $notification->message,
            'is_read' => $notification->read_at !== null,
            'created_at' => $notification->created_at,
            'read_at' => $notification->read_at,
            'payload' => $notification->payload,
            'ticket' => $ticket ? [
                'id' => (int) $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'title' => $ticket->title,
                'status' => $ticket->status,
                'url' => "/admin-it/ticket/{$ticket->id}",
            ] : null,
        ];
    }
}
