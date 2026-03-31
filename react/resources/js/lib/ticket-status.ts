export interface TicketStatusData {
    id?: number;
    status?: string | null;
    assigned_to?: number | null;
    taken_at?: string | null;
    estimated_completion_at?: string | null;
    ticket_number?: string | null;
    title?: string | null;
}

export const TICKET_STATUS = {
    OPEN: 'open',
    PENDING_ESTIMATE: 'pending_estimate',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    REOPENED: 'diproses kembali',
} as const;

const PENDING_ESTIMATE_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const normalizeTicketStatus = (status?: string | null) =>
    status?.toLowerCase().trim() ?? '';

export const getTicketStatusLabel = (status?: string | null) => {
    switch (normalizeTicketStatus(status)) {
        case TICKET_STATUS.OPEN:
            return 'Terbuka';
        case TICKET_STATUS.PENDING_ESTIMATE:
            return 'Menunggu estimasi pengerjaan';
        case TICKET_STATUS.IN_PROGRESS:
            return 'Sedang diproses';
        case TICKET_STATUS.RESOLVED:
            return 'Menunggu verifikasi';
        case TICKET_STATUS.REOPENED:
            return 'Diproses Kembali';
        case TICKET_STATUS.CLOSED:
            return 'Ditutup';
        default:
            return status || '-';
    }
};

export const isTicketPendingEstimate = (
    ticket?: TicketStatusData | null,
) => {
    if (!ticket) return false;

    return normalizeTicketStatus(ticket.status) === TICKET_STATUS.PENDING_ESTIMATE;
};

export const getPendingEstimateDeadline = (
    ticket?: TicketStatusData | null,
) => {
    if (
        !ticket ||
        !isTicketPendingEstimate(ticket) ||
        !ticket.assigned_to ||
        !ticket.taken_at ||
        ticket.estimated_completion_at
    ) {
        return null;
    }

    const takenAt = new Date(ticket.taken_at);
    if (Number.isNaN(takenAt.getTime())) {
        return null;
    }

    return new Date(takenAt.getTime() + PENDING_ESTIMATE_TIMEOUT_MS);
};

export const isPendingEstimateDueSoon = (
    ticket?: TicketStatusData | null,
    now = new Date(),
) => {
    const deadline = getPendingEstimateDeadline(ticket);
    if (!deadline) return false;

    const remainingMs = deadline.getTime() - now.getTime();

    return remainingMs > 0 && remainingMs <= ONE_DAY_MS;
};

export const isPendingEstimateExpired = (
    ticket?: TicketStatusData | null,
    now = new Date(),
) => {
    const deadline = getPendingEstimateDeadline(ticket);
    if (!deadline) return false;

    return deadline.getTime() <= now.getTime();
};

export const getPendingEstimateRemainingLabel = (
    ticket?: TicketStatusData | null,
    now = new Date(),
) => {
    const deadline = getPendingEstimateDeadline(ticket);
    if (!deadline) return null;

    const remainingMs = deadline.getTime() - now.getTime();
    if (remainingMs <= 0) {
        return 'Sudah kadaluarsa';
    }

    if (remainingMs <= 60 * 60 * 1000) {
        return `Kurang ${Math.max(1, Math.ceil(remainingMs / (60 * 1000)))} menit`;
    }

    if (remainingMs <= ONE_DAY_MS) {
        return `Kurang ${Math.ceil(remainingMs / (60 * 60 * 1000))} jam`;
    }

    return `Kurang ${Math.ceil(remainingMs / ONE_DAY_MS)} hari`;
};

export const getTicketDisplayName = (ticket?: TicketStatusData | null) => {
    if (!ticket) return 'Tiket';

    if (ticket.ticket_number && ticket.title) {
        return `${ticket.ticket_number} - ${ticket.title}`;
    }

    if (ticket.ticket_number) {
        return ticket.ticket_number;
    }

    if (ticket.title) {
        return ticket.title;
    }

    return ticket.id ? `#${ticket.id}` : 'Tiket';
};
