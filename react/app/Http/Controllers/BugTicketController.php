<?php

namespace App\Http\Controllers;

use App\Models\BugTicket;
use App\Models\ChatMessage;
use App\Models\User;
use App\Services\AdminItNotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BugTicketController extends Controller
{
    public function __construct(
        private readonly AdminItNotificationService $adminItNotificationService,
    ) {
    }

    public function index()
    {
        $this->releaseExpiredPendingEstimateTickets();
        $user = Auth::user();

        if ($user && $user->role === 'admin_it') {
            $this->adminItNotificationService->syncDueSoonNotificationsForUser($user);
        }
        
        // Developer dapat melihat semua bug tickets
        if ($user->role === 'developer') {
            $tickets = BugTicket::with([
                'user',
                'assignedAdmin',
                'estimateUpdatedBy',
                'messages.user',
            ])
                ->latest()
                ->get();
        } elseif ($user->role === 'admin_it') {
            // Admin IT melihat tiket yang:
            // 1. Belum diambil, masih open, dan sudah diberi tingkat kesulitan oleh developer
            // 2. Miliknya sendiri (assigned to admin)
            // 3. Dia adalah collaborator di tiket tersebut
            $tickets = BugTicket::with([
                'user',
                'assignedAdmin',
                'estimateUpdatedBy',
                'messages.user',
            ])
                ->where(function ($query) use ($user) {
                    $query
                        // Unassigned open tickets that are ready for admin handling
                        ->where(function ($unassignedQuery) {
                            $unassignedQuery->whereNull('assigned_to')
                                ->where('status', BugTicket::STATUS_OPEN)
                                ->whereNotNull('difficulty_level');
                        })
                        // Or tickets assigned to this admin
                        ->orWhere('assigned_to', $user->id);

                    // Or tickets where this admin is a collaborator
                    $this->orWhereCollaboratorContains($query, (int) $user->id);
                })
                ->latest()
                ->get();
        } else {
            // Jika user regular, hanya tampilkan miliknya sendiri
            $tickets = BugTicket::where('user_id', Auth::id())
                ->with([
                    'messages' => function ($query) {
                        $query->latest();
                    },
                    'messages.user',
                    'assignedAdmin',
                    'estimateUpdatedBy',
                ])
                ->latest()
                ->get();
        }

        $tickets = $this->sanitizeTakeHistoryCollectionForViewer($tickets, $user);
        $tickets = $this->appendCollaboratorsDetailsCollection($tickets);

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
                'difficulty_level' => null,
                'status' => BugTicket::STATUS_OPEN,
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

    public function replacePeriodFromImport(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->role !== 'developer') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya developer yang dapat menyimpan data import periode.',
                ], 403);
            }

            $validated = $request->validate([
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2000|max:2100',
                'tickets' => 'required|array|min:1',
                'tickets.*.ticket_number' => 'nullable|string|max:255',
                'tickets.*.title' => 'nullable|string|max:255',
                'tickets.*.description' => 'nullable|string',
                'tickets.*.priority' => 'nullable|in:low,medium,high',
                'tickets.*.difficulty_level' => 'nullable|in:easy,medium,hard',
                'tickets.*.status' => 'nullable|in:open,pending_estimate,in_progress,resolved,closed,diproses kembali',
                'tickets.*.created_at' => 'required|date',
                'tickets.*.user' => 'nullable|array',
                'tickets.*.user.name' => 'nullable|string|max:255',
                'tickets.*.user.email' => 'nullable|email|max:255',
            ]);

            $month = (int) $validated['month'];
            $year = (int) $validated['year'];
            $startOfPeriod = Carbon::create($year, $month, 1)->startOfDay();
            $endOfPeriod = (clone $startOfPeriod)->endOfMonth();

            $ticketsInPeriod = collect($validated['tickets'])
                ->filter(function ($ticket) use ($month, $year) {
                    $createdAt = Carbon::parse($ticket['created_at']);
                    return (int) $createdAt->month === $month
                        && (int) $createdAt->year === $year;
                })
                ->values();

            if ($ticketsInPeriod->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data import tidak memiliki tiket pada periode yang dipilih.',
                ], 422);
            }

            $result = DB::transaction(function () use (
                $startOfPeriod,
                $endOfPeriod,
                $ticketsInPeriod,
                $user
            ) {
                $existingTickets = BugTicket::whereBetween('created_at', [
                    $startOfPeriod,
                    $endOfPeriod,
                ])->get();

                $deletedCount = $existingTickets->count();
                foreach ($existingTickets as $existingTicket) {
                    $existingTicket->forceDelete();
                }

                $usedTicketNumbers = BugTicket::withTrashed()
                    ->whereNotNull('ticket_number')
                    ->pluck('ticket_number')
                    ->all();
                $usedTicketNumberMap = array_fill_keys($usedTicketNumbers, true);
                $nextTicketSequenceByPeriod = [];

                foreach ($usedTicketNumbers as $existingTicketNumber) {
                    if (
                        preg_match(
                            '/^TKT-(\d{6})-(\d{4})$/',
                            (string) $existingTicketNumber,
                            $matches,
                        ) === 1
                    ) {
                        $periodKey = $matches[1];
                        $nextSequence = ((int) $matches[2]) + 1;

                        if (
                            !isset($nextTicketSequenceByPeriod[$periodKey]) ||
                            $nextSequence > $nextTicketSequenceByPeriod[$periodKey]
                        ) {
                            $nextTicketSequenceByPeriod[$periodKey] = $nextSequence;
                        }
                    }
                }

                $generateUniqueTicketNumber = function (Carbon $ticketCreatedAt) use (
                    &$usedTicketNumberMap,
                    &$nextTicketSequenceByPeriod
                ) {
                    $periodKey = $ticketCreatedAt->format('Ym');
                    $nextSequence = $nextTicketSequenceByPeriod[$periodKey] ?? 1;

                    do {
                        $candidateTicketNumber = sprintf(
                            'TKT-%s-%04d',
                            $periodKey,
                            $nextSequence,
                        );
                        $nextSequence += 1;
                    } while (isset($usedTicketNumberMap[$candidateTicketNumber]));

                    $nextTicketSequenceByPeriod[$periodKey] = $nextSequence;
                    $usedTicketNumberMap[$candidateTicketNumber] = true;

                    return $candidateTicketNumber;
                };

                $createdCount = 0;
                foreach ($ticketsInPeriod as $ticketData) {
                    $createdAt = Carbon::parse($ticketData['created_at']);
                    $reporterEmail = data_get($ticketData, 'user.email');
                    $reporter = $reporterEmail
                        ? User::where('email', $reporterEmail)->first()
                        : null;

                    $ticket = new BugTicket();
                    $ticket->user_id = $reporter?->id ?? $user->id;
                    $ticket->title = trim((string) ($ticketData['title'] ?? '')) !== ''
                        ? (string) $ticketData['title']
                        : 'Laporan Import';
                    $ticket->description = (string) (
                        $ticketData['description'] ??
                        'Data laporan periode hasil import.'
                    );
                    $ticket->category = 'bug';
                    $ticket->priority = (string) ($ticketData['priority'] ?? 'medium');
                    $ticket->difficulty_level = $ticketData['difficulty_level'] ?? null;
                    $ticket->status = (string) ($ticketData['status'] ?? BugTicket::STATUS_OPEN);
                    $ticket->assigned_to = null;
                    $ticket->taken_at = null;
                    $ticket->resolved_at = in_array(
                        $ticket->status,
                        [BugTicket::STATUS_RESOLVED, BugTicket::STATUS_CLOSED],
                        true,
                    ) ? $createdAt : null;
                    $ticket->appeal_count = 0;

                    $requestedTicketNumber = trim((string) ($ticketData['ticket_number'] ?? ''));
                    if (
                        $requestedTicketNumber !== '' &&
                        !isset($usedTicketNumberMap[$requestedTicketNumber])
                    ) {
                        $ticket->ticket_number = $requestedTicketNumber;
                        $usedTicketNumberMap[$requestedTicketNumber] = true;
                    } else {
                        $ticket->ticket_number = $generateUniqueTicketNumber(
                            $createdAt,
                        );
                    }

                    $ticket->created_at = $createdAt;
                    $ticket->updated_at = $createdAt;
                    $ticket->save();

                    $createdCount += 1;
                }

                return [
                    'deleted_count' => $deletedCount,
                    'created_count' => $createdCount,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Data periode berhasil diperbarui.',
                ...$result,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi data import gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan data import: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(BugTicket $bugTicket)
    {
        $bugTicket = $this->refreshPendingEstimateTicketState($bugTicket);
        $user = Auth::user();
        if ($response = $this->forbidOtherAdminTicketAccess($bugTicket, $user)) {
            return $response;
        }

        $this->authorize('view', $bugTicket);
        $bugTicket->load([
            'messages.user',
            'user',
            'assignedAdmin',
            'estimateUpdatedBy',
        ]);
        $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);
        $bugTicket = $this->appendCollaboratorsDetailsForTicket($bugTicket);

        return response()->json($bugTicket);
    }

    public function update(Request $request, BugTicket $bugTicket)
    {
        try {
            $bugTicket = $this->refreshPendingEstimateTicketState($bugTicket);
            $user = Auth::user();
            if ($response = $this->forbidOtherAdminTicketAccess($bugTicket, $user)) {
                return $response;
            }

            $this->authorize('update', $bugTicket);
            $previousStatus = $bugTicket->status;

            $validated = $request->validate([
                'status' => 'sometimes|in:open,pending_estimate,in_progress,resolved,closed,diproses kembali',
                'priority' => 'sometimes|in:low,medium,high',
                'difficulty_level' => 'sometimes|nullable|in:easy,medium,hard',
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

            if (
                array_key_exists('difficulty_level', $validated) &&
                $user->role === 'developer' &&
                in_array($bugTicket->status, [
                    BugTicket::STATUS_PENDING_ESTIMATE,
                    BugTicket::STATUS_IN_PROGRESS,
                    BugTicket::STATUS_RESOLVED,
                ], true)
            ) {
                return response()->json([
                    'error' => 'Invalid difficulty update',
                    'message' => 'Tingkat kesulitan tidak dapat diubah saat tiket sudah diproses atau terselesaikan.',
                ], 422);
            }

            $isAdminAttemptingToHandleTicket =
                $user->role === 'admin_it' &&
                (
                    (
                        array_key_exists('assigned_to', $validated) &&
                        !empty($validated['assigned_to'])
                    ) ||
                    (
                        array_key_exists('status', $validated) &&
                        in_array($validated['status'], [
                            BugTicket::STATUS_PENDING_ESTIMATE,
                            BugTicket::STATUS_IN_PROGRESS,
                        ], true)
                    )
                );

            if (
                $isAdminAttemptingToHandleTicket &&
                !$this->ticketWillHaveDifficultyLevel($bugTicket, $validated)
            ) {
                return response()->json([
                    'error' => 'Difficulty Required',
                    'message' => 'Tiket belum dapat diproses Admin IT sebelum developer mengisi tingkat kesulitan.',
                ], 422);
            }

            if (array_key_exists('status', $validated)) {
                $requestedStatus = $validated['status'];
                $isTicketOwner = (int) $bugTicket->user_id === (int) $user->id;

                if (
                    $requestedStatus === BugTicket::STATUS_IN_PROGRESS &&
                    !$this->ticketWillHaveEstimate($bugTicket)
                ) {
                    return response()->json([
                        'error' => 'Estimate Required',
                        'message' => 'Tiket harus memiliki estimasi selesai sebelum diubah ke status Sedang diproses.',
                    ], 422);
                }

                $ownerCanCloseResolvedTicket =
                    $requestedStatus === BugTicket::STATUS_CLOSED &&
                    $isTicketOwner &&
                    $bugTicket->status === BugTicket::STATUS_RESOLVED;

                if (
                    $requestedStatus === BugTicket::STATUS_CLOSED &&
                    $isTicketOwner &&
                    $bugTicket->status !== BugTicket::STATUS_RESOLVED
                ) {
                        return response()->json([
                            'error' => 'Invalid status transition',
                            'message' => 'Tiket hanya bisa ditutup pengguna setelah statusnya Menunggu verifikasi.',
                        ], 422);
                    }

                if (!$ownerCanCloseResolvedTicket && $user->role !== 'admin_it') {
                    return response()->json([
                        'error' => 'Unauthorized',
                        'message' => 'Perubahan status ini hanya dapat dilakukan oleh Admin IT.',
                    ], 403);
                }
            }

            if (
                array_key_exists('assigned_to', $validated) &&
                !empty($validated['assigned_to'])
            ) {
                if (!$bugTicket->taken_at) {
                    $validated['taken_at'] = now()->utc();
                }

                if (!array_key_exists('status', $validated) && !$bugTicket->hasEstimate()) {
                    $validated['status'] = BugTicket::STATUS_PENDING_ESTIMATE;
                }
            }

            if (
                isset($validated['status']) &&
                in_array($validated['status'], [
                    BugTicket::STATUS_RESOLVED,
                    BugTicket::STATUS_CLOSED,
                ], true) &&
                !$bugTicket->resolved_at
            ) {
                $validated['resolved_at'] = now()->utc();
            }

            $bugTicket->update($validated);

            if (
                isset($validated['status']) &&
                in_array($validated['status'], [
                    BugTicket::STATUS_RESOLVED,
                    BugTicket::STATUS_CLOSED,
                ], true) &&
                $previousStatus !== $validated['status'] &&
                $this->isAdminCollaboratorOnTicket($bugTicket, (int) $user->id)
            ) {
                ChatMessage::create([
                    'ticket_id' => $bugTicket->id,
                    'user_id' => $user->id,
                    'message' => "Tiket telah diselesaikan oleh admin {$user->name}",
                    'is_read' => false,
                ]);
            }

            $bugTicket->load([
                'user',
                'assignedAdmin',
                'estimateUpdatedBy',
                'messages.user',
            ]);
            $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);
            $bugTicket = $this->appendCollaboratorsDetailsForTicket($bugTicket);

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
        // Handle unauthenticated requests gracefully
        if (!Auth::check()) {
            return response()->json([
                'unread_tickets' => 0,
                'total_unread' => 0,
            ], 200, [
                'Content-Type' => 'application/json',
            ]);
        }

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
        ], 200, [
            'Content-Type' => 'application/json',
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
        $adminId = (int) $adminId;
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

        // Helper function to get tickets assigned to or collaborated by admin
        // Using JSON_CONTAINS for proper JSON array comparison in MySQL
        $getAdminTicketsQuery = function ($baseQuery) use ($adminId) {
            return $baseQuery->where(function ($query) use ($adminId) {
                $query->where('assigned_to', $adminId);
                $this->orWhereCollaboratorContains($query, $adminId);
            });
        };

        // Helper to count tickets by period 
        // For assigned admin: use taken_at
        // For collaborator: use created_at (when they started collaborating)
        $countByPeriod = function ($period) use ($adminId, $today, $thisWeek, $thisMonth, $thisYear) {
            $dateFilter = match($period) {
                'today' => $today,
                'week' => $thisWeek,
                'month' => $thisMonth,
                'year' => $thisYear,
            };

            // Count tickets where admin is the owner (assigned_to)
            $ownedTickets = BugTicket::withTrashed()->where('assigned_to', $adminId)
                ->where(function ($query) use ($dateFilter) {
                    // For completed tickets, use resolved_at
                    $query->where(function ($q) use ($dateFilter) {
                        $q->whereIn('status', ['resolved', 'closed'])
                            ->whereDate('resolved_at', '>=', $dateFilter);
                    })
                    // For non-completed tickets, use taken_at
                    ->orWhere(function ($q) use ($dateFilter) {
                        $q->whereNotIn('status', ['resolved', 'closed'])
                            ->whereDate('taken_at', '>=', $dateFilter);
                    });
                })
                ->count();

            // Count tickets where admin is a collaborator
            $collaboratedTickets = $this->whereCollaboratorContains(BugTicket::withTrashed(), $adminId)
                ->where(function ($query) use ($dateFilter) {
                    // For completed tickets, use resolved_at
                    $query->where(function ($q) use ($dateFilter) {
                        $q->whereIn('status', ['resolved', 'closed'])
                            ->whereDate('resolved_at', '>=', $dateFilter);
                    })
                    // For non-completed tickets, use created_at (when ticket was created)
                    ->orWhere(function ($q) use ($dateFilter) {
                        $q->whereNotIn('status', ['resolved', 'closed'])
                            ->whereDate('created_at', '>=', $dateFilter);
                    });
                })
                ->count();

            return $ownedTickets + $collaboratedTickets;
        };

        // Build base query for all tickets (assigned or collaborated)
        $allTicketsQuery = BugTicket::withTrashed();
        $allTicketsQuery = $getAdminTicketsQuery($allTicketsQuery);

        // Build query for completed tickets
        $completedTicketsQuery = (clone $allTicketsQuery)
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
            'collab' => (clone $completedTicketsQuery)
                ->where('collaboration_type', 'collab')
                ->count(),
        ];

        // Count collaboration where this admin is a collaborator
        // Count collaboration: 
        // 1. Tickets where admin is the owner AND has collaborators (admin utama yang mengundang kolaborator)
        // 2. Tickets where admin is a collaborator (admin yang diajak kolaborasi)
        $collaborationAsOwner = BugTicket::withTrashed()->where('assigned_to', $adminId)
            ->where('collaboration_type', 'collab')
            ->count();
            
        $collaborationAsCollaborator = $this->whereCollaboratorContains(BugTicket::withTrashed(), $adminId)
            ->count();
            
        $collaborationCount = $collaborationAsOwner + $collaborationAsCollaborator;

        $stats = [
            'total_handled' => (clone $allTicketsQuery)->count(),
            'today' => $countByPeriod('today'),
            'this_week' => $countByPeriod('week'),
            'this_month' => $countByPeriod('month'),
            'this_year' => $countByPeriod('year'),
            'resolved_count' => (clone $completedTicketsQuery)->count(),
            'in_progress_count' => (clone $allTicketsQuery)
                ->where('status', 'in_progress')
                ->count(),
            'average_resolution_time' => $this->calculateAverageResolutionTime($adminId),
            'difficulty_breakdown' => $difficultyBreakdown,
            'difficulty_total' => array_sum($difficultyBreakdown),
            'collaboration_count' => $collaborationCount,
        ];

        return response()->json($stats);
    }

    private function calculateAverageResolutionTime($adminId)
    {
        $adminId = (int) $adminId;
        $resolvedTickets = BugTicket::withTrashed()->where(function ($query) use ($adminId) {
                $query->where('assigned_to', $adminId);
                $this->orWhereCollaboratorContains($query, $adminId);
            })
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
            // Query for tickets assigned or collaborated
            $baseTicketQuery = BugTicket::withTrashed()->where(function ($query) use ($admin) {
                $query->where('assigned_to', $admin->id);
                $this->orWhereCollaboratorContains($query, (int) $admin->id);
            });

            $resolved = (clone $baseTicketQuery)
                ->whereIn('status', ['resolved', 'closed'])
                ->count();
            $total = (clone $baseTicketQuery)->count();
            $avgResolution = $this->calculateAverageResolutionTime($admin->id);

            // Count collaboration: 
            // 1. Tickets where admin is the owner AND has collaborators (admin utama yang mengundang kolaborator)
            // 2. Tickets where admin is a collaborator (admin yang diajak kolaborasi)
            $collaborationAsOwner = BugTicket::withTrashed()->where('assigned_to', $admin->id)
                ->where('collaboration_type', 'collab')
                ->count();
                
            $collaborationAsCollaborator = $this->whereCollaboratorContains(BugTicket::withTrashed(), (int) $admin->id)
                ->count();

            return [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'total_handled' => $total,
                'resolved' => $resolved,
                'in_progress' => (clone $baseTicketQuery)
                    ->where('status', 'in_progress')
                    ->count(),
                'average_resolution_hours' => $avgResolution,
                'performance_score' => $this->calculatePerformanceScore($admin->id, $resolved, $total, $avgResolution),
                'collaboration_count' => $collaborationAsOwner + $collaborationAsCollaborator,
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
            $bugTicket = $this->refreshPendingEstimateTicketState($bugTicket);
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

            if (!$this->hasDifficultyLevel($bugTicket->difficulty_level)) {
                return response()->json([
                    'error' => 'Difficulty Required',
                    'message' => 'Tiket belum dapat diambil karena developer belum mengisi tingkat kesulitan.',
                ], 422);
            }

            $validated = $request->validate([
                'assigned_to' => 'required|exists:users,id',
                'status' => 'sometimes|in:pending_estimate,in_progress',
            ]);

            if ((int) $validated['assigned_to'] !== (int) $user->id) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Admin IT hanya dapat mengambil tiket untuk akunnya sendiri.',
                ], 403);
            }

            $validated['taken_at'] = now()->utc();
            if (!isset($validated['status'])) {
                $validated['status'] = BugTicket::STATUS_PENDING_ESTIMATE;
            }
            $validated['status'] = BugTicket::STATUS_PENDING_ESTIMATE;

            $bugTicket->update($validated);
            $bugTicket->refresh();
            $bugTicket->load(['user', 'assignedAdmin', 'estimateUpdatedBy']);
            $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);
            $bugTicket = $this->appendCollaboratorsDetailsForTicket($bugTicket);

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

    public function updateEstimate(Request $request, BugTicket $bugTicket)
    {
        try {
            $bugTicket = $this->refreshPendingEstimateTicketState($bugTicket);
            $user = Auth::user();
            if ($response = $this->forbidOtherAdminTicketAccess($bugTicket, $user)) {
                return $response;
            }

            $this->authorize('update', $bugTicket);

            if (!$user || !in_array($user->role, ['admin_it', 'developer'], true)) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Hanya Admin IT yang dapat mengubah estimasi dan developer hanya dapat mengirim saran estimasi.',
                ], 403);
            }

            if ((int) $bugTicket->assigned_to <= 0) {
                return response()->json([
                    'error' => 'Invalid estimate state',
                    'message' => 'Estimasi hanya dapat diatur setelah tiket diambil Admin IT.',
                ], 422);
            }

            if (in_array($bugTicket->status, [
                BugTicket::STATUS_RESOLVED,
                BugTicket::STATUS_CLOSED,
            ], true)) {
                return response()->json([
                    'error' => 'Invalid estimate state',
                    'message' => 'Estimasi tidak dapat diubah pada tiket yang sudah selesai atau ditutup.',
                ], 422);
            }

            if (
                $user->role === 'admin_it' &&
                (int) $bugTicket->assigned_to !== (int) $user->id
            ) {
                return response()->json([
                    'error' => 'Forbidden',
                    'message' => 'Hanya Admin IT pemilik tiket yang dapat mengubah estimasi.',
                ], 403);
            }

            if ($user->role === 'developer') {
                $validated = $request->validate([
                    'estimated_completion_at' => 'required|date',
                    'reason' => 'required|string|min:10|max:1000',
                ]);

                $suggestedEstimate = Carbon::parse($validated['estimated_completion_at'])->utc();
                if ($suggestedEstimate->lessThanOrEqualTo(now()->utc())) {
                    return response()->json([
                        'error' => 'Validation Error',
                        'message' => 'Estimasi harus lebih besar dari waktu saat ini.',
                        'errors' => [
                            'estimated_completion_at' => [
                                'Estimasi harus lebih besar dari waktu saat ini.',
                            ],
                        ],
                    ], 422);
                }

                $reason = trim((string) $validated['reason']);

                ChatMessage::create([
                    'ticket_id' => $bugTicket->id,
                    'user_id' => $user->id,
                    'message' => $this->buildEstimateSuggestionMessage(
                        $user,
                        $bugTicket,
                        $suggestedEstimate,
                        $reason,
                    ),
                    'is_read' => false,
                ]);

                $bugTicket->load([
                    'user',
                    'assignedAdmin',
                    'estimateUpdatedBy',
                    'messages.user',
                ]);
                $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);
                $bugTicket = $this->appendCollaboratorsDetailsForTicket($bugTicket);

                return response()->json([
                    'message' => 'Saran estimasi berhasil dikirim ke Admin IT.',
                    'ticket' => $bugTicket,
                ]);
            }

            $validated = $request->validate([
                'estimated_completion_at' => 'required|date',
                'reason' => 'nullable|string|min:10|max:1000',
            ]);

            $newEstimate = Carbon::parse($validated['estimated_completion_at'])->utc();
            if ($newEstimate->lessThanOrEqualTo(now()->utc())) {
                return response()->json([
                    'error' => 'Validation Error',
                    'message' => 'Estimasi harus lebih besar dari waktu saat ini.',
                    'errors' => [
                        'estimated_completion_at' => [
                            'Estimasi harus lebih besar dari waktu saat ini.',
                        ],
                    ],
                ], 422);
            }

            $previousEstimate = $bugTicket->estimated_completion_at
                ? Carbon::parse($bugTicket->estimated_completion_at)->utc()
                : null;
            $estimateChanged = !$previousEstimate || !$previousEstimate->equalTo($newEstimate);
            $reason = trim((string) ($validated['reason'] ?? ''));

            if (!$estimateChanged) {
                $bugTicket->load([
                    'user',
                    'assignedAdmin',
                    'estimateUpdatedBy',
                    'messages.user',
                ]);
                $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);
                $bugTicket = $this->appendCollaboratorsDetailsForTicket($bugTicket);

                return response()->json([
                    'message' => 'Estimasi tidak berubah.',
                    'ticket' => $bugTicket,
                ]);
            }

            $bugTicket->update([
                'estimated_completion_at' => $newEstimate,
                'estimate_updated_by' => $user->id,
                'estimate_updated_at' => now()->utc(),
                'estimate_change_reason' => $reason !== '' ? $reason : null,
                'status' => in_array($bugTicket->status, [
                    BugTicket::STATUS_OPEN,
                    BugTicket::STATUS_PENDING_ESTIMATE,
                ], true)
                    ? BugTicket::STATUS_IN_PROGRESS
                    : $bugTicket->status,
            ]);

            ChatMessage::create([
                'ticket_id' => $bugTicket->id,
                'user_id' => $user->id,
                'message' => $this->buildEstimateUpdateMessage(
                    $user,
                    $previousEstimate,
                    $newEstimate,
                    $reason,
                ),
                'is_read' => false,
            ]);

            $this->adminItNotificationService->markTicketNotificationsAsRead($bugTicket);

            $bugTicket->refresh();
            $bugTicket->load([
                'user',
                'assignedAdmin',
                'estimateUpdatedBy',
                'messages.user',
            ]);
            $bugTicket = $this->sanitizeTakeHistoryForViewer($bugTicket, $user);
            $bugTicket = $this->appendCollaboratorsDetailsForTicket($bugTicket);

            return response()->json([
                'message' => 'Estimasi berhasil diperbarui.',
                'ticket' => $bugTicket,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation Error',
                'message' => 'Data tidak valid',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Anda tidak memiliki izin untuk mengubah estimasi tiket ini.',
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
                    $bugTicket->load([
                        'user',
                        'messages.user',
                        'assignedAdmin',
                        'estimateUpdatedBy',
                    ]),
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
        $thisMonth = now()->startOfMonth();
        $thisYear = now()->startOfYear();
        
        $stats = $admins->map(function ($admin) use ($lastTwoDaysStart, $thisMonth, $thisYear) {
            // Query for tickets assigned or collaborated
            $baseTicketQuery = function () use ($admin) {
                return BugTicket::withTrashed()->where(function ($query) use ($admin) {
                    $query->where('assigned_to', $admin->id);
                    $this->orWhereCollaboratorContains($query, (int) $admin->id);
                });
            };

            $totalTickets = $baseTicketQuery()->count();
            $resolved = $baseTicketQuery()
                ->whereIn('status', ['resolved', 'closed'])
                ->count();
            $inProgress = $baseTicketQuery()
                ->where('status', 'in_progress')
                ->count();
            $pending = $baseTicketQuery()
                ->where('status', 'open')
                ->count();
            
            // Count by period using resolved_at for completed, taken_at for others
            $thisMonthTickets = $baseTicketQuery()
                ->where(function ($q) use ($thisMonth) {
                    $q->where(function ($q2) use ($thisMonth) {
                        $q2->whereIn('status', ['resolved', 'closed'])
                            ->whereDate('resolved_at', '>=', $thisMonth);
                    })
                    ->orWhere(function ($q2) use ($thisMonth) {
                        $q2->whereNotIn('status', ['resolved', 'closed'])
                            ->whereDate('taken_at', '>=', $thisMonth);
                    });
                })
                ->count();
            
            $thisYearTickets = $baseTicketQuery()
                ->where(function ($q) use ($thisYear) {
                    $q->where(function ($q2) use ($thisYear) {
                        $q2->whereIn('status', ['resolved', 'closed'])
                            ->whereDate('resolved_at', '>=', $thisYear);
                    })
                    ->orWhere(function ($q2) use ($thisYear) {
                        $q2->whereNotIn('status', ['resolved', 'closed'])
                            ->whereDate('taken_at', '>=', $thisYear);
                    });
                })
                ->count();
            
            $avgResolution = $this->calculateAverageResolutionTime($admin->id);
            $performanceScore = $this->calculatePerformanceScore($admin->id, $resolved, $totalTickets, $avgResolution);
            $resolvedLastTwoDays = $baseTicketQuery()
                ->whereIn('status', ['resolved', 'closed'])
                ->whereNotNull('resolved_at')
                ->where('resolved_at', '>=', $lastTwoDaysStart)
                ->count();
            $averageResolvedPerDay = round($resolvedLastTwoDays / 2, 2);
            
            $collaborationCount = $baseTicketQuery()
                ->where('collaboration_type', 'collab')
                ->count();
            
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
                'collaboration_count' => $collaborationCount,
                'created_at' => $admin->created_at,
                'updated_at' => $admin->updated_at,
            ];
        })->sortByDesc('performance_score')->values();

        return response()->json($stats);
    }

    public function inviteCollaborator(Request $request, BugTicket $bugTicket)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin_it') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Hanya Admin IT yang dapat menambah kolaborator.',
                ], 403);
            }

            // Pastikan ticket sudah diambil dan dihandle oleh user ini
            if ((int) $bugTicket->assigned_to !== (int) $user->id) {
                return response()->json([
                    'error' => 'Forbidden',
                    'message' => 'Tiket ini bukan milik Anda. Hanya pemilik tiket yang dapat menambah kolaborator.',
                ], 403);
            }

            $validated = $request->validate([
                'collaborator_id' => 'required|exists:users,id',
            ]);

            $collaboratorId = $validated['collaborator_id'];

            // Pastikan admin yang diundang adalah admin_it
            $collaborator = \App\Models\User::find($collaboratorId);
            if (!$collaborator || $collaborator->role !== 'admin_it') {
                return response()->json([
                    'error' => 'Invalid collaborator',
                    'message' => 'Hanya Admin IT yang dapat menjadi kolaborator.',
                ], 422);
            }

            // Jangan izinkan user menginvite dirinya sendiri
            if ((int) $collaboratorId === (int) $user->id) {
                return response()->json([
                    'error' => 'Invalid collaborator',
                    'message' => 'Anda tidak dapat menginvite diri sendiri sebagai kolaborator.',
                ], 422);
            }

            // Tambah collaborator
            $bugTicket->addCollaborator($collaboratorId);
            $bugTicket->collaboration_type = 'collab';
            $bugTicket->save();

            $bugTicket->refresh();
            $bugTicket->load(['user', 'assignedAdmin', 'estimateUpdatedBy']);

            return response()->json([
                'success' => true,
                'message' => 'Kolaborator berhasil ditambahkan',
                'ticket' => $bugTicket,
                'collaborators' => $bugTicket->getCollaboratorsDetails(),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation Error',
                'message' => 'Data tidak valid',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server Error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function removeCollaborator(Request $request, BugTicket $bugTicket)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin_it') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Hanya Admin IT yang dapat menghapus kolaborator.',
                ], 403);
            }

            // Pastikan ticket sudah diambil dan dihandle oleh user ini
            if ((int) $bugTicket->assigned_to !== (int) $user->id) {
                return response()->json([
                    'error' => 'Forbidden',
                    'message' => 'Tiket ini bukan milik Anda.',
                ], 403);
            }

            $validated = $request->validate([
                'collaborator_id' => 'required|exists:users,id',
            ]);

            $collaboratorId = $validated['collaborator_id'];

            // Hapus collaborator
            $bugTicket->removeCollaborator($collaboratorId);

            // Jika tidak ada collaborator lagi, ubah collaboration_type kembali ke solo
            if (empty($bugTicket->collaborators)) {
                $bugTicket->collaboration_type = 'solo';
            }

            $bugTicket->save();

            $bugTicket->refresh();
            $bugTicket->load(['user', 'assignedAdmin', 'estimateUpdatedBy']);

            return response()->json([
                'success' => true,
                'message' => 'Kolaborator berhasil dihapus',
                'ticket' => $bugTicket,
                'collaborators' => $bugTicket->getCollaboratorsDetails(),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation Error',
                'message' => 'Data tidak valid',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server Error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCollaborators(BugTicket $bugTicket)
    {
        try {
            $user = Auth::user();

            if ($response = $this->forbidOtherAdminTicketAccess($bugTicket, $user)) {
                return $response;
            }

            $this->authorize('view', $bugTicket);

            return response()->json([
                'success' => true,
                'collaboration_type' => $bugTicket->collaboration_type ?? 'solo',
                'collaborators' => $bugTicket->getCollaboratorsDetails(),
                'main_admin' => [
                    'id' => $bugTicket->assignedAdmin?->id,
                    'name' => $bugTicket->assignedAdmin?->name,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Server Error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function whereCollaboratorContains($query, int $adminId)
    {
        return $query->where(function ($collaboratorQuery) use ($adminId) {
            $this->applyCollaboratorContainsConstraint($collaboratorQuery, $adminId);
        });
    }

    private function appendCollaboratorsDetailsCollection($tickets)
    {
        $normalizedTickets = collect($tickets);

        $collaboratorIds = $normalizedTickets
            ->flatMap(function (BugTicket $ticket) {
                return collect($ticket->collaborators ?? [])
                    ->map(fn ($id) => (int) $id);
            })
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        if ($collaboratorIds->isEmpty()) {
            return $normalizedTickets->map(function (BugTicket $ticket) {
                $ticket->setAttribute('collaborators_details', []);
                return $ticket;
            });
        }

        $collaboratorsById = User::whereIn('id', $collaboratorIds->all())
            ->get(['id', 'name', 'email'])
            ->keyBy('id');

        return $normalizedTickets->map(function (BugTicket $ticket) use ($collaboratorsById) {
            $details = collect($ticket->collaborators ?? [])
                ->map(fn ($id) => (int) $id)
                ->filter(fn (int $id) => $id > 0)
                ->unique()
                ->map(function (int $id) use ($collaboratorsById) {
                    $collaborator = $collaboratorsById->get($id);
                    if (!$collaborator) {
                        return null;
                    }

                    return [
                        'id' => (int) $collaborator->id,
                        'name' => $collaborator->name,
                        'email' => $collaborator->email,
                    ];
                })
                ->filter()
                ->values()
                ->all();

            $ticket->setAttribute('collaborators_details', $details);

            return $ticket;
        });
    }

    private function appendCollaboratorsDetailsForTicket(BugTicket $ticket): BugTicket
    {
        $ticket->setAttribute('collaborators_details', $ticket->getCollaboratorsDetails());
        return $ticket;
    }

    private function buildEstimateUpdateMessage(
        User $actor,
        ?Carbon $previousEstimate,
        Carbon $newEstimate,
        string $reason = ''
    ): string {
        $actorLabel = $actor->role === 'developer'
            ? "developer {$actor->name}"
            : "Admin IT {$actor->name}";

        $formattedNewEstimate = $this->formatEstimateForMessage($newEstimate);
        $formattedPreviousEstimate = $previousEstimate
            ? $this->formatEstimateForMessage($previousEstimate)
            : null;

        if ($formattedPreviousEstimate) {
            $message = "Estimasi selesai diperbarui oleh {$actorLabel} dari {$formattedPreviousEstimate} menjadi {$formattedNewEstimate}.";
        } else {
            $message = "Estimasi selesai telah diatur oleh {$actorLabel}: {$formattedNewEstimate}.";
        }

        if ($reason !== '') {
            $message .= ' Alasan perubahan: ' . Str::squish($reason);
        }

        return $message;
    }

    private function buildEstimateSuggestionMessage(
        User $actor,
        BugTicket $ticket,
        Carbon $suggestedEstimate,
        string $reason
    ): string {
        $actorLabel = "developer {$actor->name}";
        $currentEstimate = $ticket->estimated_completion_at
            ? Carbon::parse($ticket->estimated_completion_at)->utc()
            : null;
        $formattedSuggestedEstimate = $this->formatEstimateForMessage($suggestedEstimate);

        if ($currentEstimate) {
            return "Saran estimasi selesai dari {$actorLabel}. Estimasi saat ini: {$this->formatEstimateForMessage($currentEstimate)}. Saran baru: {$formattedSuggestedEstimate}. Alasan: " . Str::squish($reason);
        }

        return "Saran estimasi selesai dari {$actorLabel}. Admin IT belum menetapkan estimasi selesai untuk tiket ini. Saran baru: {$formattedSuggestedEstimate}. Alasan: " . Str::squish($reason);
    }

    private function formatEstimateForMessage(Carbon $estimate): string
    {
        return $estimate
            ->copy()
            ->timezone('Asia/Jakarta')
            ->locale('id')
            ->translatedFormat('d M Y H:i') . ' WIB';
    }

    private function orWhereCollaboratorContains($query, int $adminId)
    {
        return $query->orWhere(function ($collaboratorQuery) use ($adminId) {
            $this->applyCollaboratorContainsConstraint($collaboratorQuery, $adminId);
        });
    }

    private function applyCollaboratorContainsConstraint($query, int $adminId): void
    {
        $query->whereJsonContains('collaborators', $adminId)
            ->orWhereJsonContains('collaborators', (string) $adminId);
    }

    private function isAdminCollaboratorOnTicket(BugTicket $ticket, int $userId): bool
    {
        if ((int) $ticket->assigned_to === $userId) {
            return false;
        }

        $collaboratorIds = collect($ticket->collaborators ?? [])
            ->map(fn ($id) => (int) $id)
            ->all();

        return in_array($userId, $collaboratorIds, true);
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

        // Developer membutuhkan visibilitas penuh untuk monitoring laporan.
        if (($viewer->role ?? null) === 'developer') {
            return $ticket;
        }

        // Show full info jika viewer adalah pelapor tiket (user pemilik tiket)
        if ((int) $ticket->user_id === (int) $viewer->id) {
            return $ticket;
        }

        // Show full info jika tiket belum diambil atau viewer adalah admin yang mengambil tiket
        if (!$ticket->assigned_to || (int) $ticket->assigned_to === (int) $viewer->id) {
            return $ticket;
        }

        // Show full info jika viewer adalah collaborator
        $isCollaborator = in_array($viewer->id, $ticket->collaborators ?? []);
        if ($isCollaborator) {
            return $ticket;
        }

        // Hide history jika bukan pemilik dan bukan collaborator
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
            // Allow access jika viewer adalah collaborator
            $isCollaborator = in_array($viewer->id, $ticket->collaborators ?? []);
            if (!$isCollaborator) {
                return response()->json([
                    'error' => 'Forbidden',
                    'message' => 'Tiket ini milik akun admin lain dan tidak dapat diakses.',
                ], 403);
            }
        }

        if (
            !$ticket->assigned_to &&
            $ticket->status !== BugTicket::STATUS_OPEN
        ) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Tiket tanpa admin handler tidak dapat diakses pada status ini.',
            ], 403);
        }

        if (
            !$ticket->assigned_to &&
            $ticket->status === BugTicket::STATUS_OPEN &&
            !$this->hasDifficultyLevel($ticket->difficulty_level)
        ) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Tiket ini belum terlihat untuk Admin IT karena developer belum mengisi tingkat kesulitan.',
            ], 403);
        }

        return null;
    }

    private function hasDifficultyLevel($difficultyLevel): bool
    {
        return is_string($difficultyLevel) && trim($difficultyLevel) !== '';
    }

    private function ticketWillHaveDifficultyLevel(BugTicket $ticket, array $validated): bool
    {
        if (array_key_exists('difficulty_level', $validated)) {
            return $this->hasDifficultyLevel($validated['difficulty_level']);
        }

        return $this->hasDifficultyLevel($ticket->difficulty_level);
    }

    private function ticketWillHaveEstimate(BugTicket $ticket): bool
    {
        return $ticket->hasEstimate();
    }

    private function refreshPendingEstimateTicketState(BugTicket $ticket): BugTicket
    {
        if ($ticket->shouldReleasePendingEstimate(now()->utc())) {
            $this->releasePendingEstimateTicket($ticket);
            $ticket->refresh();
        }

        return $ticket;
    }

    private function releaseExpiredPendingEstimateTickets(): void
    {
        BugTicket::query()
            ->where('status', BugTicket::STATUS_PENDING_ESTIMATE)
            ->whereNotNull('assigned_to')
            ->whereNull('estimated_completion_at')
            ->whereNotNull('taken_at')
            ->get()
            ->filter(fn (BugTicket $ticket) => $ticket->shouldReleasePendingEstimate(now()->utc()))
            ->each(function (BugTicket $ticket) {
                $this->releasePendingEstimateTicket($ticket);
            });
    }

    private function releasePendingEstimateTicket(BugTicket $ticket): void
    {
        $assignedAdminId = (int) $ticket->assigned_to;

        $ticket->update([
            'status' => BugTicket::STATUS_OPEN,
            'assigned_to' => null,
            'taken_at' => null,
            'collaboration_type' => 'solo',
            'collaborators' => null,
        ]);

        $this->adminItNotificationService->markTicketNotificationsAsRead(
            $ticket,
            $assignedAdminId,
        );
    }
}
