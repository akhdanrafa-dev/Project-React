export interface TicketTimingData {
    status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    resolved_at?: string | null;
}

const LOCAL_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
};

const toValidDate = (value?: string | Date | null) => {
    const parsedDate =
        value instanceof Date
            ? value
            : value
              ? new Date(value)
              : null;

    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
};

export const formatTicketLocalDateTime = (value?: string | Date | null) => {
    const parsedDate = toValidDate(value);
    if (!parsedDate) return '-';

    return parsedDate.toLocaleString('id-ID', LOCAL_DATE_TIME_OPTIONS);
};

export const getTicketCompletedAt = (ticket?: TicketTimingData | null) => {
    if (!ticket) return null;

    const normalizedStatus = ticket.status?.toLowerCase() ?? '';
    const candidates =
        normalizedStatus === 'closed'
            ? [ticket.updated_at, ticket.resolved_at]
            : normalizedStatus === 'resolved'
              ? [ticket.resolved_at, ticket.updated_at]
              : [];

    for (const candidate of candidates) {
        const parsedDate = toValidDate(candidate);
        if (parsedDate) {
            return parsedDate;
        }
    }

    return null;
};

export const formatTicketCompletedAt = (ticket?: TicketTimingData | null) =>
    formatTicketLocalDateTime(getTicketCompletedAt(ticket));
