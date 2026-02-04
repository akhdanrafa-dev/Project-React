<?php

namespace App\Http\Controllers;

use App\Models\BugTicket;
use App\Models\ChatMessage;
use App\Models\StaffDeveloperChat;
use App\Models\StaffDeveloperChatMessage;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatMessageController extends Controller
{
    use AuthorizesRequests;

    public function store(Request $request, BugTicket $bugTicket)
    {
        $this->authorize('view', $bugTicket);

        if ($bugTicket->isArchivedChat()) {
            return response()->json([
                'error' => 'Ticket archived',
                'message' => 'Chat tiket ini sudah diarsipkan.',
            ], 403);
        }

        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        $message = ChatMessage::create([
            'ticket_id' => $bugTicket->id,
            'user_id' => Auth::id(),
            'message' => $validated['message'],
            'is_read' => false,
        ]);

        $message->load('user');

        return response()->json($message, 201);
    }

    public function getMessages(BugTicket $bugTicket)
    {
        $this->authorize('view', $bugTicket);

        $messages = $bugTicket->messages()
            ->with('user')
            ->latest()
            ->get()
            ->reverse()
            ->values();

        return response()->json($messages);
    }

    public function markAsRead(ChatMessage $chatMessage)
    {
        $chatMessage->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function markAllAsRead(BugTicket $bugTicket)
    {
        $this->authorize('view', $bugTicket);

        $bugTicket->messages()
            ->where('is_read', false)
            ->where('user_id', '!=', Auth::id())
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function storeStaffDeveloperMessage(Request $request, $otherUserId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'User tidak ter-autentikasi.',
                ], 401);
            }

            $otherUser = User::find($otherUserId);
            
            if (!$otherUser) {
                return response()->json([
                    'error' => 'User not found',
                    'message' => 'User tidak ditemukan.',
                ], 404);
            }

            if (($user->role === 'staff' && $otherUser->role !== 'developer') ||
                ($user->role === 'developer' && $otherUser->role !== 'staff')) {
                return response()->json([
                    'error' => 'Invalid user',
                    'message' => 'Chat hanya bisa dilakukan antara staff dan developer.',
                ], 400);
            }

            $validated = $request->validate([
                'message' => 'required|string|max:5000',
            ]);

            $staffId = $user->role === 'staff' ? $user->id : $otherUser->id;
            $developerId = $user->role === 'developer' ? $user->id : $otherUser->id;

            $chat = StaffDeveloperChat::firstOrCreate(
                [
                    'staff_id' => $staffId,
                    'developer_id' => $developerId,
                ]
            );

            $message = StaffDeveloperChatMessage::create([
                'chat_id' => $chat->id,
                'user_id' => $user->id,
                'message' => $validated['message'],
                'is_read' => false,
            ]);

            $message->load('user');

            return response()->json([
                'id' => $message->id,
                'chat_id' => $message->chat_id,
                'user_id' => $message->user_id,
                'message' => $message->message,
                'is_read' => $message->is_read,
                'created_at' => $message->created_at,
                'updated_at' => $message->updated_at,
                'user' => $message->user,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('StaffDeveloperMessage Error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'other_user_id' => $otherUserId ?? 'null',
                'exception' => $e,
            ]);
            
            return response()->json([
                'error' => 'Server error',
                'message' => 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.',
            ], 500);
        }
    }

    public function getStaffDeveloperMessages($otherUserId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'User tidak ter-autentikasi.',
                ], 401);
            }

            $otherUser = User::find($otherUserId);
            
            if (!$otherUser) {
                return response()->json([
                    'error' => 'User not found',
                    'message' => 'User tidak ditemukan.',
                ], 404);
            }

            if (($user->role === 'staff' && $otherUser->role !== 'developer') ||
                ($user->role === 'developer' && $otherUser->role !== 'staff')) {
                return response()->json([
                    'error' => 'Invalid user',
                    'message' => 'Chat hanya bisa dilakukan antara staff dan developer.',
                ], 400);
            }

            $staffId = $user->role === 'staff' ? $user->id : $otherUser->id;
            $developerId = $user->role === 'developer' ? $user->id : $otherUser->id;

            $chat = StaffDeveloperChat::where('staff_id', $staffId)
                ->where('developer_id', $developerId)
                ->first();

            $messages = [];
            if ($chat) {
                $messages = $chat->messages()
                    ->with('user')
                    ->latest()
                    ->get()
                    ->reverse()
                    ->values()
                    ->map(function ($msg) {
                        return [
                            'id' => $msg->id,
                            'sender' => $msg->user->role,
                            'message' => $msg->message,
                            'created_at' => $msg->created_at,
                        ];
                    })
                    ->toArray();
            }

            return response()->json([
                'messages' => $messages,
            ]);
        } catch (\Exception $e) {
            \Log::error('GetStaffDeveloperMessages Error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'other_user_id' => $otherUserId ?? 'null',
                'exception' => $e,
            ]);
            
            return response()->json([
                'error' => 'Server error',
                'message' => 'Terjadi kesalahan saat mengambil pesan. Silakan coba lagi.',
            ], 500);
        }
    }

    public function deleteStaffDeveloperMessages($otherUserId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'User tidak ter-autentikasi.',
                ], 401);
            }

            $otherUser = User::find($otherUserId);
            
            if (!$otherUser) {
                return response()->json([
                    'error' => 'User not found',
                    'message' => 'User tidak ditemukan.',
                ], 404);
            }

            if (($user->role === 'staff' && $otherUser->role !== 'developer') ||
                ($user->role === 'developer' && $otherUser->role !== 'staff')) {
                return response()->json([
                    'error' => 'Invalid user',
                    'message' => 'Chat hanya bisa dilakukan antara staff dan developer.',
                ], 400);
            }

            $staffId = $user->role === 'staff' ? $user->id : $otherUser->id;
            $developerId = $user->role === 'developer' ? $user->id : $otherUser->id;

            $chat = StaffDeveloperChat::where('staff_id', $staffId)
                ->where('developer_id', $developerId)
                ->first();

            if ($chat) {
                $chat->messages()->delete();
                $chat->delete();
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            \Log::error('DeleteStaffDeveloperMessages Error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'other_user_id' => $otherUserId ?? 'null',
                'exception' => $e,
            ]);
            
            return response()->json([
                'error' => 'Server error',
                'message' => 'Terjadi kesalahan saat menghapus riwayat. Silakan coba lagi.',
            ], 500);
        }
    }
}
