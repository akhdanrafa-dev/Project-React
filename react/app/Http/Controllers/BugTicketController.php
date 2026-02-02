<?php

namespace App\Http\Controllers;

use App\Models\BugTicket;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BugTicketController extends Controller
{
    public function index()
    {
        $tickets = BugTicket::where('user_id', Auth::id())
            ->with(['messages' => function ($query) {
                $query->latest();
            }])
            ->latest()
            ->get();

        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        try {
            $user_id = Auth::id();
            
            if (!$user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak authenticated',
                ], 401);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'category' => 'required|in:bug,feedback,complaint',
                'priority' => 'required|in:low,medium,high',
            ]);

            $ticket = BugTicket::create([
                'user_id' => $user_id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'category' => $validated['category'],
                'priority' => $validated['priority'],
                'status' => 'open',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Laporan berhasil dibuat',
                'id' => $ticket->id,
                'data' => $ticket,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(BugTicket $bugTicket)
    {
        $this->authorize('view', $bugTicket);

        $bugTicket->load(['messages.user', 'user', 'assignedTo']);

        return response()->json($bugTicket);
    }

    public function update(Request $request, BugTicket $bugTicket)
    {
        $this->authorize('update', $bugTicket);

        $validated = $request->validate([
            'status' => 'sometimes|in:open,in_progress,resolved,closed',
            'priority' => 'sometimes|in:low,medium,high',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
        ]);

        $bugTicket->update($validated);

        return response()->json($bugTicket);
    }

    public function getUnreadCount()
    {
        $count = BugTicket::where('user_id', Auth::id())
            ->whereHas('messages', function ($query) {
                $query->where('is_read', false)
                    ->where('user_id', '!=', Auth::id());
            })
            ->count();

        $totalUnread = ChatMessage::where('is_read', false)
            ->where('user_id', '!=', Auth::id())
            ->whereHas('ticket', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->count();

        return response()->json([
            'unread_tickets' => $count,
            'total_unread' => $totalUnread,
        ]);
    }

    public function markTicketAsRead(BugTicket $bugTicket)
    {
        $this->authorize('view', $bugTicket);

        $bugTicket->messages()
            ->where('user_id', '!=', Auth::id())
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }
}
