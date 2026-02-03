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
        $user = Auth::user();
        
        // Jika user adalah developer atau admin_it, tampilkan semua bug tickets
        if ($user->role === 'developer' || $user->role === 'admin_it') {
        $tickets = BugTicket::with(['user', 'assignedAdmin', 'messages.user'])
            ->oldest()
            ->get();
        } else {
            // Jika user regular, hanya tampilkan miliknya sendiri
            $tickets = BugTicket::where('user_id', Auth::id())
                ->with([
                    'messages' => function ($query) {
                        $query->latest();
                    },
                    'messages.user',
                ])
                ->latest()
                ->get();
        }

        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        // Untuk membuat laporan bug baru
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
        try {
            $this->authorize('update', $bugTicket);

            $validated = $request->validate([
                'status' => 'sometimes|in:open,in_progress,resolved,closed',
                'priority' => 'sometimes|in:low,medium,high',
                'difficulty_level' => 'sometimes|in:easy,medium,hard',
                'assigned_to' => 'sometimes|nullable|exists:users,id',
            ]);

            if (isset($validated['assigned_to']) && !$bugTicket->taken_at) {
                $validated['taken_at'] = now();
            }

            if (
                isset($validated['status']) &&
                in_array($validated['status'], ['resolved', 'closed']) &&
                !$bugTicket->resolved_at
            ) {
                $validated['resolved_at'] = now();
            }

            $bugTicket->update($validated);
            $bugTicket->refresh();

            return response()->json($bugTicket);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation Error',
                'message' => 'Data tidak valid',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Anda tidak memiliki izin untuk mengubah tiket ini',
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server Error',
                'message' => $e->getMessage(),
            ], 500);
        }
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

    public function getAdminStats($adminId)
    {
        $admin = \App\Models\User::find($adminId);
        
        if (!$admin || $admin->role !== 'admin_it') {
            return response()->json([
                'error' => 'Admin not found',
            ], 404);
        }

        $today = now()->startOfDay();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();
        $thisYear = now()->startOfYear();

        $stats = [
            'total_handled' => BugTicket::where('assigned_to', $adminId)->count(),
            'today' => BugTicket::where('assigned_to', $adminId)
                ->whereDate('taken_at', '>=', $today)
                ->count(),
            'this_week' => BugTicket::where('assigned_to', $adminId)
                ->whereDate('taken_at', '>=', $thisWeek)
                ->count(),
            'this_month' => BugTicket::where('assigned_to', $adminId)
                ->whereDate('taken_at', '>=', $thisMonth)
                ->count(),
            'this_year' => BugTicket::where('assigned_to', $adminId)
                ->whereDate('taken_at', '>=', $thisYear)
                ->count(),
            'resolved_count' => BugTicket::where('assigned_to', $adminId)
                ->whereIn('status', ['resolved', 'closed'])
                ->count(),
            'in_progress_count' => BugTicket::where('assigned_to', $adminId)
                ->where('status', 'in_progress')
                ->count(),
            'average_resolution_time' => $this->calculateAverageResolutionTime($adminId),
            'difficulty_breakdown' => [
                'easy' => BugTicket::where('assigned_to', $adminId)
                    ->where('difficulty_level', 'easy')
                    ->count(),
                'medium' => BugTicket::where('assigned_to', $adminId)
                    ->where('difficulty_level', 'medium')
                    ->count(),
                'hard' => BugTicket::where('assigned_to', $adminId)
                    ->where('difficulty_level', 'hard')
                    ->count(),
            ],
        ];

        return response()->json($stats);
    }

    private function calculateAverageResolutionTime($adminId)
    {
        $resolvedTickets = BugTicket::where('assigned_to', $adminId)
            ->whereNotNull('taken_at')
            ->whereNotNull('resolved_at')
            ->get();

        if ($resolvedTickets->isEmpty()) {
            return 0;
        }

        $totalTime = $resolvedTickets->sum(function ($ticket) {
            return $ticket->resolved_at->diffInHours($ticket->taken_at);
        });

        return round($totalTime / $resolvedTickets->count(), 2);
    }

    public function getAllAdminsRanking()
    {
        $admins = \App\Models\User::where('role', 'admin_it')->get();
        
        $ranking = $admins->map(function ($admin) {
            $resolved = BugTicket::where('assigned_to', $admin->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->count();
            $total = BugTicket::where('assigned_to', $admin->id)->count();
            $avgResolution = $this->calculateAverageResolutionTime($admin->id);

            return [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'total_handled' => $total,
                'resolved' => $resolved,
                'in_progress' => BugTicket::where('assigned_to', $admin->id)
                    ->where('status', 'in_progress')
                    ->count(),
                'average_resolution_hours' => $avgResolution,
                'performance_score' => $this->calculatePerformanceScore($admin->id, $resolved, $total, $avgResolution),
            ];
        })->sortByDesc('performance_score')->values();

        return response()->json($ranking);
    }

    private function calculatePerformanceScore($adminId, $resolved, $total, $avgResolution)
    {
        if ($total === 0) {
            return 0;
        }

        $resolutionRate = ($resolved / $total) * 100;
        $speedScore = 100 - min($avgResolution / 2, 50);
        
        return round(($resolutionRate * 0.7) + (max(0, $speedScore) * 0.3), 2);
    }
}
