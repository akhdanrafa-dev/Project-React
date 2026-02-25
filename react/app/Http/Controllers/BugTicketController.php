<?php

namespace App\Http\Controllers;

use App\Models\BugTicket;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class BugTicketController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Developer dapat melihat semua bug tickets
        if ($user->role === 'developer') {
            $tickets = BugTicket::with(['user', 'assignedAdmin', 'messages.user'])
                ->oldest()
                ->get();
        } elseif ($user->role === 'admin_it') {
            // Admin IT hanya melihat tiket yang belum diambil atau miliknya sendiri
            $tickets = BugTicket::with(['user', 'assignedAdmin', 'messages.user'])
                ->where(function ($query) use ($user) {
                    $query->where(function ($unassignedQuery) {
                        $unassignedQuery->whereNull('assigned_to')
                            ->where('status', '!=', 'closed');
                    })->orWhere('assigned_to', $user->id);
                })
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

        $tickets = $this->sanitizeTakeHistoryCollectionForViewer($tickets, $user);

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
        $user = Auth::user();
        if ($response = $this->forbidOtherAdminTicketAccess($bugTicket, $user)) {
            return $response;
        }

        $this->authorize('view', $bugTicket);
        $bugTicket->load(['messages.user', 'user', 'assignedAdmin']);
        $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);

        return response()->json($bugTicket);
    }

    public function update(Request $request, BugTicket $bugTicket)
    {
        try {
            $user = Auth::user();
            if ($response = $this->forbidOtherAdminTicketAccess($bugTicket, $user)) {
                return $response;
            }

            $this->authorize('update', $bugTicket);

            $validated = $request->validate([
                'status' => 'sometimes|in:open,in_progress,resolved,closed,diproses kembali',
                'priority' => 'sometimes|in:low,medium,high',
                'difficulty_level' => 'sometimes|in:easy,medium,hard',
                'assigned_to' => 'sometimes|nullable|exists:users,id',
            ]);

            if (array_key_exists('assigned_to', $validated) && $user->role !== 'admin_it') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Hanya Admin IT yang dapat mengubah penugasan tiket.',
                ], 403);
            }

            if (array_key_exists('priority', $validated) && $user->role !== 'admin_it') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Hanya Admin IT yang dapat mengubah prioritas tiket.',
                ], 403);
            }

            if (
                array_key_exists('difficulty_level', $validated) &&
                !in_array($user->role, ['admin_it', 'developer'], true)
            ) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Anda tidak memiliki izin untuk mengubah tingkat kesulitan tiket.',
                ], 403);
            }

            if (array_key_exists('status', $validated)) {
                $requestedStatus = $validated['status'];
                $isTicketOwner = (int) $bugTicket->user_id === (int) $user->id;

                $ownerCanCloseResolvedTicket =
                    $requestedStatus === 'closed' &&
                    $isTicketOwner &&
                    $bugTicket->status === 'resolved';

                if ($requestedStatus === 'closed' && $isTicketOwner && $bugTicket->status !== 'resolved') {
                    return response()->json([
                        'error' => 'Invalid status transition',
                        'message' => 'Tiket hanya bisa ditutup pengguna setelah statusnya Terselesaikan.',
                    ], 422);
                }

                if (!$ownerCanCloseResolvedTicket && $user->role !== 'admin_it') {
                    return response()->json([
                        'error' => 'Unauthorized',
                        'message' => 'Perubahan status ini hanya dapat dilakukan oleh Admin IT.',
                    ], 403);
                }
            }

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
            $bugTicket->load(['user', 'assignedAdmin', 'messages.user']);
            $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);

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

    public function destroy(BugTicket $bugTicket)
    {
        try {
            $this->authorize('delete', $bugTicket);

            if ($bugTicket->status !== 'closed') {
                return response()->json([
                    'error' => 'Invalid status',
                    'message' => 'Hanya tiket yang sudah ditutup yang dapat dihapus.',
                ], 422);
            }

            $imagePaths = $bugTicket->messages()
                ->whereNotNull('image_path')
                ->pluck('image_path')
                ->filter()
                ->values()
                ->all();

            $bugTicket->delete();

            if (!empty($imagePaths)) {
                Storage::disk('public')->delete($imagePaths);
            }

            return response()->json([
                'success' => true,
                'message' => 'Tiket berhasil dihapus',
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Anda tidak memiliki izin untuk menghapus tiket ini',
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
        $user = Auth::user();
        if ($response = $this->forbidOtherAdminTicketAccess($bugTicket, $user)) {
            return $response;
        }

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
        $completedStatuses = ['resolved', 'closed'];
        $completedTicketsQuery = BugTicket::where('assigned_to', $adminId)
            ->whereIn('status', $completedStatuses);

        $difficultyBreakdown = [
            'easy' => (clone $completedTicketsQuery)
                ->where('difficulty_level', 'easy')
                ->count(),
            'medium' => (clone $completedTicketsQuery)
                ->where('difficulty_level', 'medium')
                ->count(),
            'hard' => (clone $completedTicketsQuery)
                ->where('difficulty_level', 'hard')
                ->count(),
        ];

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
                ->whereIn('status', $completedStatuses)
                ->count(),
            'in_progress_count' => BugTicket::where('assigned_to', $adminId)
                ->where('status', 'in_progress')
                ->count(),
            'average_resolution_time' => $this->calculateAverageResolutionTime($adminId),
            'difficulty_breakdown' => $difficultyBreakdown,
            'difficulty_total' => array_sum($difficultyBreakdown),
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

    public function take(Request $request, BugTicket $bugTicket)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin_it') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Hanya Admin IT yang dapat mengambil tiket.',
                ], 403);
            }

            if ($response = $this->forbidOtherAdminTicketAccess($bugTicket, $user)) {
                return $response;
            }

            $this->authorize('update', $bugTicket);

            $validated = $request->validate([
                'assigned_to' => 'required|exists:users,id',
                'status' => 'sometimes|in:in_progress',
            ]);

            if ((int) $validated['assigned_to'] !== (int) $user->id) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Admin IT hanya dapat mengambil tiket untuk akunnya sendiri.',
                ], 403);
            }

            $validated['taken_at'] = now();
            if (!isset($validated['status'])) {
                $validated['status'] = 'in_progress';
            }

            $bugTicket->update($validated);
            $bugTicket->refresh();
            $bugTicket->load(['user', 'assignedAdmin']);
            $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);

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

    public function submitAppeal(Request $request, BugTicket $bugTicket)
    {
        try {
            \Log::info('Appeal submission started', [
                'ticket_id' => $bugTicket->id,
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            $this->authorize('appeal', $bugTicket);

            $validated = $request->validate([
                'reason' => 'required|string|min:10|max:1000',
            ]);

            $MAX_APPEALS = 3;
            if ($bugTicket->appeal_count >= $MAX_APPEALS) {
                return response()->json([
                    'error' => 'Appeal Limit Exceeded',
                    'message' => 'Anda telah mencapai batas maksimal aju banding (3x)',
                ], 422);
            }

            $newAppealCount = $bugTicket->appeal_count + 1;
            
            $bugTicket->update([
                'appeal_count' => $newAppealCount,
                'status' => 'diproses kembali'
            ]);

            $bugTicket->refresh();

            \Log::info('Appeal submitted successfully', [
                'ticket_id' => $bugTicket->id,
                'new_appeal_count' => $bugTicket->appeal_count
            ]);

            return response()->json([
                'message' => 'Aju banding berhasil diajukan',
                'appeal_count' => $bugTicket->appeal_count,
                'ticket' => $this->sanitizeTakeHistoryForViewer(
                    $bugTicket->load(['user', 'messages.user']),
                    Auth::user()
                ),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Appeal validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'error' => 'Validation Error',
                'message' => 'Data tidak valid',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            \Log::warning('Appeal authorization failed', ['user_id' => Auth::id(), 'ticket_id' => $bugTicket->id]);
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Anda tidak memiliki izin untuk mengajukan banding pada tiket ini',
            ], 403);
        } catch (\Exception $e) {
            \Log::error('Appeal submission error', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Server Error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getAdminActivityStats()
    {
        $admins = \App\Models\User::where('role', 'admin_it')->get();
        $lastTwoDaysStart = now()->subDays(2);
        
        $stats = $admins->map(function ($admin) use ($lastTwoDaysStart) {
            $totalTickets = BugTicket::where('assigned_to', $admin->id)->count();
            $resolved = BugTicket::where('assigned_to', $admin->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->count();
            $inProgress = BugTicket::where('assigned_to', $admin->id)
                ->where('status', 'in_progress')
                ->count();
            $pending = BugTicket::where('assigned_to', $admin->id)
                ->where('status', 'open')
                ->count();
            
            $thisMonth = now()->startOfMonth();
            $thisYear = now()->startOfYear();
            
            $thisMonthTickets = BugTicket::where('assigned_to', $admin->id)
                ->whereDate('taken_at', '>=', $thisMonth)
                ->count();
            
            $thisYearTickets = BugTicket::where('assigned_to', $admin->id)
                ->whereDate('taken_at', '>=', $thisYear)
                ->count();
            
            $avgResolution = $this->calculateAverageResolutionTime($admin->id);
            $performanceScore = $this->calculatePerformanceScore($admin->id, $resolved, $totalTickets, $avgResolution);
            $resolvedLastTwoDays = BugTicket::where('assigned_to', $admin->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->whereNotNull('resolved_at')
                ->where('resolved_at', '>=', $lastTwoDaysStart)
                ->count();
            $averageResolvedPerDay = round($resolvedLastTwoDays / 2, 2);
            
            return [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'total_tickets' => $totalTickets,
                'resolved' => $resolved,
                'in_progress' => $inProgress,
                'pending' => $pending,
                'this_month' => $thisMonthTickets,
                'this_year' => $thisYearTickets,
                'average_resolution_hours' => $avgResolution,
                'performance_score' => $performanceScore,
                'resolution_rate' => $totalTickets > 0 ? round(($resolved / $totalTickets) * 100, 2) : 0,
                'resolved_last_two_days' => $resolvedLastTwoDays,
                'average_resolved_per_day' => $averageResolvedPerDay,
                'created_at' => $admin->created_at,
                'updated_at' => $admin->updated_at,
            ];
        })->sortByDesc('performance_score')->values();

        return response()->json($stats);
    }

    private function sanitizeTakeHistoryCollectionForViewer($tickets, $viewer)
    {
        return $tickets->map(function (BugTicket $ticket) use ($viewer) {
            return $this->sanitizeTakeHistoryForViewer($ticket, $viewer);
        });
    }

    private function sanitizeTakeHistoryForViewer(BugTicket $ticket, $viewer): BugTicket
    {
        if (!$viewer) {
            return $ticket;
        }

        if (!$ticket->assigned_to || (int) $ticket->assigned_to === (int) $viewer->id) {
            return $ticket;
        }

        // Riwayat pengambilan tiket bersifat privat untuk admin pemilik akun pengambil.
        $ticket->setAttribute('assigned_to', null);
        $ticket->setAttribute('taken_at', null);

        if ($ticket->relationLoaded('assignedAdmin')) {
            $ticket->setRelation('assignedAdmin', null);
        }

        return $ticket;
    }

    private function forbidOtherAdminTicketAccess(BugTicket $ticket, $viewer)
    {
        if (!$viewer || $viewer->role !== 'admin_it') {
            return null;
        }

        if ($ticket->assigned_to && (int) $ticket->assigned_to !== (int) $viewer->id) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Tiket ini milik akun admin lain dan tidak dapat diakses.',
            ], 403);
        }

        if (!$ticket->assigned_to && $ticket->status === 'closed') {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Tiket yang sudah ditutup tidak dapat diakses.',
            ], 403);
        }

        return null;
    }
}
