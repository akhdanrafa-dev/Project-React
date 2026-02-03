<?php

namespace App\Http\Controllers;

use App\Models\BugTicket;
use App\Models\ChatMessage;
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
}
