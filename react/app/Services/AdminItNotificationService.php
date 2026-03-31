<?php

namespace App\Services;

use App\Models\AdminItNotification;
use App\Models\BugTicket;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AdminItNotificationService
{
    public function syncDueSoonNotificationsForUser(User $user): void
    {
        if ($user->role !== 'admin_it') {
            return;
        }

        $now = now()->utc();
        $warningWindowEnd = $now->copy()->addDay();

        BugTicket::query()
            ->where('status', BugTicket::STATUS_PENDING_ESTIMATE)
            ->where('assigned_to', $user->id)
            ->whereNull('estimated_completion_at')
            ->whereNotNull('taken_at')
            ->get()
            ->each(function (BugTicket $ticket) use ($user, $now, $warningWindowEnd) {
                $deadline = $ticket->estimateAssignmentDeadlineAt();

                if (
                    !$deadline ||
                    $deadline->lessThanOrEqualTo($now) ||
                    $deadline->greaterThan($warningWindowEnd)
                ) {
                    return;
                }

                AdminItNotification::query()->firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'bug_ticket_id' => $ticket->id,
                        'type' => AdminItNotification::TYPE_PENDING_ESTIMATE_DUE_SOON,
                        'context_key' => $this->buildPendingEstimateDueSoonContextKey($ticket),
                    ],
                    [
                        'title' => $this->buildPendingEstimateDueSoonTitle($ticket),
                        'message' => $this->buildPendingEstimateDueSoonMessage($ticket, $deadline),
                        'payload' => [
                            'deadline_at' => $deadline->toISOString(),
                            'ticket_number' => $ticket->ticket_number,
                            'ticket_title' => $ticket->title,
                            'ticket_status' => $ticket->status,
                        ],
                    ],
                );
            });
    }

    public function markTicketNotificationsAsRead(BugTicket $ticket, ?int $userId = null): void
    {
        $recipientId = $userId ?: (int) $ticket->assigned_to;

        if ($recipientId <= 0) {
            return;
        }

        $timestamp = now()->utc();

        AdminItNotification::query()
            ->where('user_id', $recipientId)
            ->where('bug_ticket_id', $ticket->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
    }

    public function getTypeLabel(string $type): string
    {
        return match ($type) {
            AdminItNotification::TYPE_PENDING_ESTIMATE_DUE_SOON => 'Estimasi hampir kadaluarsa',
            default => Str::headline($type),
        };
    }

    private function buildPendingEstimateDueSoonContextKey(BugTicket $ticket): string
    {
        $takenAt = $ticket->taken_at
            ? Carbon::parse($ticket->taken_at)->utc()->format('YmdHis')
            : 'unknown';

        return sprintf('pending-estimate-due-soon:%s', $takenAt);
    }

    private function buildPendingEstimateDueSoonTitle(BugTicket $ticket): string
    {
        $ticketNumber = trim((string) $ticket->ticket_number);

        if ($ticketNumber !== '') {
            return sprintf('Tiket %s segera kadaluarsa', $ticketNumber);
        }

        return 'Tiket segera kadaluarsa';
    }

    private function buildPendingEstimateDueSoonMessage(
        BugTicket $ticket,
        Carbon $deadline,
    ): string {
        $ticketNumber = trim((string) $ticket->ticket_number);
        $ticketTitle = trim((string) $ticket->title);
        $ticketLabel = $ticketNumber !== ''
            ? $ticketNumber
            : 'tanpa nomor';
        $titleLabel = $ticketTitle !== ''
            ? Str::limit($ticketTitle, 100)
            : 'Tanpa judul';
        $deadlineLabel = $deadline
            ->copy()
            ->timezone(config('app.timezone', 'UTC'))
            ->format('d/m/Y H:i');

        return sprintf(
            'Tiket %s - %s akan kadaluarsa jika Anda tidak menentukan estimasi selesainya. Segera atur estimasinya sebelum %s.',
            $ticketLabel,
            $titleLabel,
            $deadlineLabel,
        );
    }
}
