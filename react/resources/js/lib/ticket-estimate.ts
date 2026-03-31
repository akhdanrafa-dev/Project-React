export interface EstimateUserBrief {
    id: number;
    name: string;
}

export interface TicketEstimateData {
    id: number;
    status?: string;
    assigned_to?: number | null;
    estimated_completion_at?: string | null;
    estimate_updated_at?: string | null;
    estimate_change_reason?: string | null;
    estimateUpdatedBy?: EstimateUserBrief | null;
    estimate_updated_by_user?: EstimateUserBrief | null;
}

const pad = (value: number) => String(value).padStart(2, '0');

export const formatTicketEstimate = (value?: string | null) => {
    if (!value) return 'Belum diatur';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Belum diatur';

    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatTicketEstimateInputValue = (value?: string | null) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const toEstimateIsoString = (localDateTimeValue: string) => {
    const date = new Date(localDateTimeValue);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString();
};

export const getTicketEstimateActorName = (ticket?: TicketEstimateData | null) =>
    ticket?.estimateUpdatedBy?.name ??
    ticket?.estimate_updated_by_user?.name ??
    null;

export const canEditTicketEstimate = (
    ticket: TicketEstimateData | null,
    currentUserRole?: string,
    currentUserId?: number,
) => {
    if (!ticket || !currentUserRole) return false;

    const normalizedStatus = ticket.status?.toLowerCase() ?? '';
    if (!ticket.assigned_to) return false;
    if (['resolved', 'closed'].includes(normalizedStatus)) return false;

    if (currentUserRole === 'developer') {
        return true;
    }

    if (currentUserRole === 'admin_it') {
        return Number(ticket.assigned_to) === Number(currentUserId ?? 0);
    }

    return false;
};

export const requiresDeveloperEstimateReason = (
    ticket: TicketEstimateData | null,
    currentUserRole: string | undefined,
    nextEstimateInputValue: string,
) => {
    if (currentUserRole !== 'developer') return false;
    if (!ticket?.estimated_completion_at) return false;

    return (
        formatTicketEstimateInputValue(ticket.estimated_completion_at) !==
        nextEstimateInputValue
    );
};
