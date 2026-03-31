import { ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TicketEstimateDialog } from '@/components/ticket-estimate-dialog';
import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-trigger';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import RootLayout from '@/layouts/app/RootLayouts';
import {
    formatTicketEstimate,
    TicketEstimateData,
} from '@/lib/ticket-estimate';
import {
    getTicketStatusLabel,
    normalizeTicketStatus,
    TICKET_STATUS,
} from '@/lib/ticket-status';
import { formatTicketLocalDateTime } from '@/lib/ticket-timing';

type AdminBrief = {
    id: number;
    name: string;
};

type CollaboratorDetail = {
    id: number;
    name: string;
    email?: string;
};

interface BugTicket {
    id: number;
    ticket_number: string;
    title: string;
    priority: string;
    difficulty_level?: string;
    status: string;
    user_id: number;
    assigned_to?: number | null;
    created_at: string;
    updated_at?: string | null;
    resolved_at?: string | null;
    collaboration_type?: string | null;
    collaborators?: Array<number | string> | null;
    collaborators_details?: CollaboratorDetail[] | null;
    estimated_completion_at?: string | null;
    estimate_updated_at?: string | null;
    estimate_change_reason?: string | null;
    estimateUpdatedBy?: AdminBrief | null;
    estimate_updated_by_user?: AdminBrief | null;
    user?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
    assignedAdmin?: AdminBrief | null;
    assigned_admin?: AdminBrief | null;
}

type ApiBugTicket = BugTicket & {
    assigned_admin?: BugTicket['assignedAdmin'];
};

type StatusFilter =
    | 'all'
    | 'open'
    | 'pending_estimate'
    | 'in_progress'
    | 'resolved';

const NO_ADMIN_REPORT_VALUE = '__no_admin_report__';

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Mudah' },
    { value: 'medium', label: 'Sedang' },
    { value: 'hard', label: 'Sulit' },
];

const normalizeTicket = (ticket: ApiBugTicket): BugTicket => ({
    ...ticket,
    assignedAdmin: ticket.assignedAdmin ?? ticket.assigned_admin ?? null,
});

const parseDateInput = (value: string, endOfDay = false) => {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;

    return new Date(
        year,
        month - 1,
        day,
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0,
    );
};

const matchesDateRange = (
    createdAtValue: string,
    startDateInput: string,
    endDateInput: string,
) => {
    const createdAt = new Date(createdAtValue);
    if (Number.isNaN(createdAt.getTime())) return false;

    const startDate = startDateInput ? parseDateInput(startDateInput) : null;
    const endDate = endDateInput ? parseDateInput(endDateInput, true) : null;

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
        return false;
    }

    if (startDate && createdAt.getTime() < startDate.getTime()) return false;
    if (endDate && createdAt.getTime() > endDate.getTime()) return false;

    return true;
};

const formatDateInputForDisplay = (value: string) => {
    const parsedDate = parseDateInput(value);
    if (!parsedDate) return value;

    return parsedDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const isDifficultyLocked = (status: string) =>
    [
        TICKET_STATUS.PENDING_ESTIMATE,
        TICKET_STATUS.IN_PROGRESS,
        TICKET_STATUS.RESOLVED,
    ].includes(
        normalizeTicketStatus(status) as
            | 'pending_estimate'
            | 'in_progress'
            | 'resolved',
    );

const isCollabTicket = (ticket: BugTicket) =>
    normalizeTicketStatus(ticket.collaboration_type ?? '') === 'collab';

export default function DeveloperToolsPage() {
    return (
        <RootLayout hideFloatingChat>
            <DeveloperToolsContent />
        </RootLayout>
    );
}

function DeveloperToolsContent() {
    const { toast } = useToast();
    const [tickets, setTickets] = useState<BugTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [adminReportFilter, setAdminReportFilter] = useState('all');
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [updatingTicketId, setUpdatingTicketId] = useState<number | null>(
        null,
    );
    const [collaboratorsByTicket, setCollaboratorsByTicket] = useState<
        Record<number, CollaboratorDetail[]>
    >({});
    const [loadingCollaboratorsTicketId, setLoadingCollaboratorsTicketId] =
        useState<number | null>(null);
    const [estimateDialogTicket, setEstimateDialogTicket] =
        useState<BugTicket | null>(null);

    const fetchTickets = useCallback(async () => {
        try {
            const response = await fetch('/api/bug-tickets');
            if (!response.ok) throw new Error('Gagal mengambil ticket');

            const data = await response.json();
            const normalizedTickets = Array.isArray(data)
                ? data.map((ticket: ApiBugTicket) => normalizeTicket(ticket))
                : [];

            setTickets(normalizedTickets);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast({
                title: 'Error',
                description: 'Gagal mengambil data ticket',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        void fetchTickets();

        const interval = setInterval(() => {
            void fetchTickets();
        }, 3000);

        return () => clearInterval(interval);
    }, [fetchTickets]);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchTickets();
        setIsRefreshing(false);

        toast({
            title: 'Sukses',
            description: 'Data telah diperbarui',
        });
    };

    const getPriorityValue = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 3;
            case 'medium':
                return 2;
            case 'low':
                return 1;
            default:
                return 0;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return <Badge variant="destructive">Tinggi</Badge>;
            case 'medium':
                return <Badge variant="default">Sedang</Badge>;
            case 'low':
                return <Badge variant="secondary">Rendah</Badge>;
            default:
                return <Badge>{priority}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (normalizeTicketStatus(status)) {
            case TICKET_STATUS.OPEN:
                return <Badge variant="outline">Terbuka</Badge>;
            case TICKET_STATUS.PENDING_ESTIMATE:
                return (
                    <Badge className="bg-amber-500">
                        Menunggu Estimasi Pengerjaan
                    </Badge>
                );
            case TICKET_STATUS.IN_PROGRESS:
                return <Badge className="bg-blue-500">Sedang Diproses</Badge>;
            case TICKET_STATUS.RESOLVED:
                return (
                    <Badge className="bg-green-500">Menunggu Verifikasi</Badge>
                );
            case TICKET_STATUS.CLOSED:
                return <Badge className="bg-gray-500">Ditutup</Badge>;
            default:
                return <Badge>{getTicketStatusLabel(status)}</Badge>;
        }
    };

    const getCsrfToken = () => {
        return (
            document
                .querySelector("meta[name='csrf-token']")
                ?.getAttribute('content') || ''
        );
    };

    const updateDifficulty = async (ticketId: number, difficulty: string) => {
        const selectedTicket = tickets.find((ticket) => ticket.id === ticketId);

        if (selectedTicket && isDifficultyLocked(selectedTicket.status)) {
            toast({
                title: 'Tidak Diizinkan',
                description:
                    'Tingkat kesulitan tidak bisa diubah saat tiket sudah diproses atau terselesaikan',
                variant: 'destructive',
            });
            return;
        }

        setUpdatingTicketId(ticketId);

        try {
            const csrfToken = getCsrfToken();
            const bodyData: Record<string, string | null> = {
                difficulty_level: difficulty || null,
            };

            const response = await fetch(`/api/bug-tickets/${ticketId}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-Token': csrfToken || '',
                },
                body: JSON.stringify(bodyData),
            });

            const contentType = response.headers.get('content-type') ?? '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : { message: await response.text() };

            if (!response.ok) {
                const errorMsg =
                    payload?.message ||
                    payload?.error ||
                    `Error ${response.status}`;
                throw new Error(errorMsg);
            }

            setTickets((prevTickets) =>
                prevTickets.map((ticket) =>
                    ticket.id === ticketId
                        ? {
                              ...ticket,
                              difficulty_level: difficulty || undefined,
                          }
                        : ticket,
                ),
            );

            toast({
                title: 'Sukses',
                description:
                    !selectedTicket?.difficulty_level && difficulty
                        ? 'Tingkat kesulitan berhasil diisi. Tiket sekarang terlihat oleh Admin IT.'
                        : 'Tingkat kesulitan berhasil diubah',
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Gagal mengubah tingkat kesulitan';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setUpdatingTicketId(null);
        }
    };

    const loadCollaborators = async (ticketId: number) => {
        setLoadingCollaboratorsTicketId(ticketId);

        try {
            const response = await fetch(
                `/api/bug-tickets/${ticketId}/collaborators`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Gagal memuat kolaborator (HTTP ${response.status})`,
                );
            }

            const data = await response.json();
            const collaborators = Array.isArray(data?.collaborators)
                ? (data.collaborators as CollaboratorDetail[])
                : [];

            setCollaboratorsByTicket((prev) => ({
                ...prev,
                [ticketId]: collaborators,
            }));
        } catch (error) {
            console.error('Failed to load collaborators:', error);
        } finally {
            setLoadingCollaboratorsTicketId((prev) =>
                prev === ticketId ? null : prev,
            );
        }
    };

    const getWorkingAdmins = useCallback(
        (ticket: BugTicket): Array<{ id: number | null; name: string }> => {
            const result: Array<{ id: number | null; name: string }> = [];

            if (ticket.assignedAdmin?.name) {
                result.push({
                    id: Number.isFinite(ticket.assignedAdmin.id)
                        ? ticket.assignedAdmin.id
                        : null,
                    name: ticket.assignedAdmin.name,
                });
            }

            const collaboratorsFromState = collaboratorsByTicket[ticket.id];
            const collaboratorsFallback = ticket.collaborators_details ?? [];
            const collaborators = collaboratorsFromState?.length
                ? collaboratorsFromState
                : collaboratorsFallback;

            collaborators.forEach((collaborator) => {
                if (!collaborator?.name) return;
                result.push({
                    id: Number.isFinite(collaborator.id)
                        ? collaborator.id
                        : null,
                    name: collaborator.name,
                });
            });

            return result.filter((item, index, arr) => {
                const key = `${item.id ?? 'none'}-${item.name.toLowerCase()}`;
                return (
                    arr.findIndex(
                        (candidate) =>
                            `${candidate.id ?? 'none'}-${candidate.name.toLowerCase()}` ===
                            key,
                    ) === index
                );
            });
        },
        [collaboratorsByTicket],
    );

    const activeTickets = useMemo(
        () =>
            tickets.filter(
                (ticket) =>
                    normalizeTicketStatus(ticket.status) !==
                    TICKET_STATUS.CLOSED,
            ),
        [tickets],
    );

    const isDateRangeInvalid = useMemo(() => {
        if (!reportStartDate || !reportEndDate) return false;
        const startDate = parseDateInput(reportStartDate);
        const endDate = parseDateInput(reportEndDate, true);
        if (!startDate || !endDate) return true;
        return startDate.getTime() > endDate.getTime();
    }, [reportEndDate, reportStartDate]);

    const dateRangeSummary = useMemo(() => {
        if (reportStartDate && reportEndDate) {
            return `${formatDateInputForDisplay(reportStartDate)} - ${formatDateInputForDisplay(reportEndDate)}`;
        }

        if (reportStartDate) {
            return `Dari ${formatDateInputForDisplay(reportStartDate)}`;
        }

        if (reportEndDate) {
            return `Sampai ${formatDateInputForDisplay(reportEndDate)}`;
        }

        return 'Semua tanggal';
    }, [reportEndDate, reportStartDate]);

    const adminReportTickets = useMemo(
        () =>
            activeTickets
                .filter((ticket) =>
                    matchesDateRange(
                        ticket.created_at,
                        reportStartDate,
                        reportEndDate,
                    ),
                )
                .filter(
                    (ticket) =>
                        normalizeTicketStatus(ticket.status) !==
                        TICKET_STATUS.OPEN,
                )
                .filter((ticket) => getWorkingAdmins(ticket).length > 0),
        [activeTickets, getWorkingAdmins, reportEndDate, reportStartDate],
    );

    const adminReportOptions = useMemo(() => {
        const uniqueAdmins = new Map<string, string>();

        adminReportTickets.forEach((ticket) => {
            getWorkingAdmins(ticket).forEach((admin) => {
                const adminName = admin.name?.trim();
                if (!adminName) return;

                const key = adminName.toLocaleLowerCase('id');
                if (!uniqueAdmins.has(key)) {
                    uniqueAdmins.set(key, adminName);
                }
            });
        });

        return Array.from(uniqueAdmins.values()).sort((left, right) =>
            left.localeCompare(right, 'id'),
        );
    }, [adminReportTickets, getWorkingAdmins]);

    const isAdminReportFilterDisabled = statusFilter === 'open';
    const adminReportFilterValue = isAdminReportFilterDisabled
        ? NO_ADMIN_REPORT_VALUE
        : adminReportFilter;

    useEffect(() => {
        if (
            adminReportFilter !== 'all' &&
            !adminReportOptions.includes(adminReportFilter)
        ) {
            setAdminReportFilter('all');
        }
    }, [adminReportFilter, adminReportOptions]);

    const statusCounts = useMemo(() => {
        const rangeFilteredTickets = activeTickets.filter((ticket) =>
            matchesDateRange(ticket.created_at, reportStartDate, reportEndDate),
        );
        const open = rangeFilteredTickets.filter(
            (ticket) =>
                normalizeTicketStatus(ticket.status) === TICKET_STATUS.OPEN,
        ).length;
        const pendingEstimate = rangeFilteredTickets.filter(
            (ticket) =>
                normalizeTicketStatus(ticket.status) ===
                TICKET_STATUS.PENDING_ESTIMATE,
        ).length;
        const inProgress = rangeFilteredTickets.filter(
            (ticket) =>
                normalizeTicketStatus(ticket.status) ===
                TICKET_STATUS.IN_PROGRESS,
        ).length;
        const resolved = rangeFilteredTickets.filter(
            (ticket) =>
                normalizeTicketStatus(ticket.status) === TICKET_STATUS.RESOLVED,
        ).length;

        return {
            all: rangeFilteredTickets.length,
            open,
            pending_estimate: pendingEstimate,
            in_progress: inProgress,
            resolved,
        };
    }, [activeTickets, reportEndDate, reportStartDate]);

    const filteredTickets = useMemo(
        () =>
            activeTickets
                .filter((ticket) =>
                    matchesDateRange(
                        ticket.created_at,
                        reportStartDate,
                        reportEndDate,
                    ),
                )
                .filter((ticket) =>
                    statusFilter === 'all'
                        ? true
                        : normalizeTicketStatus(ticket.status) === statusFilter,
                )
                .filter((ticket) => {
                    if (
                        isAdminReportFilterDisabled ||
                        adminReportFilter === 'all'
                    ) {
                        return true;
                    }

                    return getWorkingAdmins(ticket).some(
                        (admin) =>
                            admin.name.localeCompare(adminReportFilter, 'id', {
                                sensitivity: 'accent',
                            }) === 0,
                    );
                })
                .filter(
                    (ticket) =>
                        ticket.ticket_number
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        ticket.user?.name
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        ticket.user?.email
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                )
                .sort((a, b) => {
                    const createdAtDiff =
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime();
                    if (createdAtDiff !== 0) return createdAtDiff;

                    const priorityDiff =
                        getPriorityValue(b.priority) -
                        getPriorityValue(a.priority);
                    if (priorityDiff !== 0) return priorityDiff;
                    return 0;
                }),
        [
            activeTickets,
            adminReportFilter,
            getWorkingAdmins,
            isAdminReportFilterDisabled,
            reportEndDate,
            reportStartDate,
            searchQuery,
            statusFilter,
        ],
    );

    return (
        <>
            <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/developer-dashboard">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/developer/tools">
                                Laporan
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Bug Masuk</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Input
                                    placeholder="Cari berdasarkan nomor tiket, username, atau email..."
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    className="max-w-sm"
                                />
                                <Button
                                    onClick={handleManualRefresh}
                                    disabled={isRefreshing}
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                    />
                                    {isRefreshing
                                        ? 'Memperbarui...'
                                        : 'Segarkan'}
                                </Button>
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                                <select
                                    value={adminReportFilterValue}
                                    onChange={(event) =>
                                        setAdminReportFilter(event.target.value)
                                    }
                                    disabled={isAdminReportFilterDisabled}
                                    className={`h-9 rounded-md border px-3 py-1.5 text-sm ${
                                        isAdminReportFilterDisabled
                                            ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                                            : 'bg-white text-black dark:bg-gray-800 dark:text-white'
                                    }`}
                                    aria-label="Filter rekap hasil admin IT"
                                >
                                    {isAdminReportFilterDisabled ? (
                                        <option value={NO_ADMIN_REPORT_VALUE}>
                                            Tidak ada laporan admin IT
                                        </option>
                                    ) : (
                                        <>
                                            <option value="all">
                                                Rekap semua Admin IT
                                            </option>
                                            {adminReportOptions.map(
                                                (adminName) => (
                                                    <option
                                                        key={adminName}
                                                        value={adminName}
                                                    >
                                                        {adminName}
                                                    </option>
                                                ),
                                            )}
                                        </>
                                    )}
                                </select>

                                <Button
                                    size="sm"
                                    onClick={() => {
                                        window.location.href =
                                            '/developer/laporan-periode';
                                    }}
                                >
                                    Laporan Periode
                                </Button>

                                <Input
                                    id="report-start-date"
                                    type="date"
                                    value={reportStartDate}
                                    onChange={(event) =>
                                        setReportStartDate(event.target.value)
                                    }
                                    className="h-9 w-[150px]"
                                    aria-label="Tanggal awal periode"
                                />

                                <Input
                                    id="report-end-date"
                                    type="date"
                                    value={reportEndDate}
                                    onChange={(event) =>
                                        setReportEndDate(event.target.value)
                                    }
                                    className="h-9 w-[150px]"
                                    aria-label="Tanggal akhir periode"
                                />

                                <select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target.value as StatusFilter,
                                        )
                                    }
                                    className="rounded border bg-white px-3 py-1.5 text-sm text-black dark:bg-gray-800 dark:text-white"
                                    aria-label="Filter status laporan"
                                >
                                    <option value="all">
                                        Semua laporan ({statusCounts.all})
                                    </option>
                                    <option value="open">
                                        Laporan masuk ({statusCounts.open})
                                    </option>
                                    <option value="pending_estimate">
                                        Menunggu estimasi pengerjaan (
                                        {statusCounts.pending_estimate})
                                    </option>
                                    <option value="in_progress">
                                        Sedang diproses (
                                        {statusCounts.in_progress})
                                    </option>
                                    <option value="resolved">
                                        Menunggu verifikasi (
                                        {statusCounts.resolved})
                                    </option>
                                </select>
                            </div>
                        </div>

                        {isDateRangeInvalid ? (
                            <p className="text-sm text-red-600">
                                Tanggal awal harus lebih kecil atau sama dengan
                                tanggal akhir.
                            </p>
                        ) : null}

                        <Separator />

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                Id
                                            </TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Waktu Masuk</TableHead>
                                            <TableHead>Nomor Tiket</TableHead>
                                            <TableHead>Prioritas</TableHead>
                                            <TableHead>Kesulitan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Estimasi</TableHead>
                                            <TableHead>Handle By</TableHead>
                                            <TableHead className="w-28">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTickets.length > 0 ? (
                                            filteredTickets.map((ticket) => {
                                                const difficultyDisabled =
                                                    updatingTicketId ===
                                                        ticket.id ||
                                                    isDifficultyLocked(
                                                        ticket.status,
                                                    );
                                                const workingAdmins =
                                                    getWorkingAdmins(ticket);

                                                return (
                                                    <TableRow key={ticket.id}>
                                                        <TableCell className="font-medium">
                                                            {ticket.id}
                                                        </TableCell>
                                                        <TableCell>
                                                            {ticket.user
                                                                ?.name || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {ticket.user
                                                                ?.email ||
                                                                'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatTicketLocalDateTime(
                                                                ticket.created_at,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm">
                                                            {
                                                                ticket.ticket_number
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {getPriorityBadge(
                                                                ticket.priority,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div
                                                                title={
                                                                    isDifficultyLocked(
                                                                        ticket.status,
                                                                    )
                                                                        ? 'Tidak bisa diubah saat tiket sudah diproses atau terselesaikan'
                                                                        : 'Ubah tingkat kesulitan'
                                                                }
                                                                className="inline-block"
                                                            >
                                                                <select
                                                                    value={
                                                                        ticket.difficulty_level ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateDifficulty(
                                                                            ticket.id,
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        difficultyDisabled
                                                                    }
                                                                    className="rounded border bg-white px-2 py-1 text-xs text-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white"
                                                                    aria-label="Ubah tingkat kesulitan"
                                                                >
                                                                    <option value="">
                                                                        Belum di
                                                                        tentukan
                                                                    </option>
                                                                    {DIFFICULTY_OPTIONS.map(
                                                                        (
                                                                            option,
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    option.value
                                                                                }
                                                                                value={
                                                                                    option.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    option.label
                                                                                }
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(
                                                                ticket.status,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-medium">
                                                                    {formatTicketEstimate(
                                                                        ticket.estimated_completion_at,
                                                                    )}
                                                                </p>
                                                                {ticket
                                                                    .estimateUpdatedBy
                                                                    ?.name ? (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Oleh{' '}
                                                                        {
                                                                            ticket
                                                                                .estimateUpdatedBy
                                                                                .name
                                                                        }
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isCollabTicket(
                                                                ticket,
                                                            ) ? (
                                                                <DropdownMenu
                                                                    onOpenChange={(
                                                                        open,
                                                                    ) => {
                                                                        if (
                                                                            open
                                                                        ) {
                                                                            void loadCollaborators(
                                                                                ticket.id,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 max-w-[240px] gap-1.5"
                                                                        >
                                                                            <span className="truncate">
                                                                                {workingAdmins.length >
                                                                                0
                                                                                    ? workingAdmins
                                                                                          .map(
                                                                                              (
                                                                                                  admin,
                                                                                              ) =>
                                                                                                  admin.name,
                                                                                          )
                                                                                          .join(
                                                                                              ', ',
                                                                                          )
                                                                                    : 'collab'}
                                                                            </span>
                                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent
                                                                        align="start"
                                                                        className="w-56"
                                                                    >
                                                                        <DropdownMenuLabel>
                                                                            Admin
                                                                            yang
                                                                            mengerjakan
                                                                        </DropdownMenuLabel>
                                                                        <div className="px-2 pb-2 text-sm">
                                                                            {loadingCollaboratorsTicketId ===
                                                                                ticket.id &&
                                                                            workingAdmins.length ===
                                                                                0 ? (
                                                                                <p className="text-muted-foreground">
                                                                                    Memuat...
                                                                                </p>
                                                                            ) : workingAdmins.length >
                                                                              0 ? (
                                                                                <ul className="space-y-1">
                                                                                    {workingAdmins.map(
                                                                                        (
                                                                                            admin,
                                                                                            index,
                                                                                        ) => (
                                                                                            <li
                                                                                                key={`${admin.id ?? 'none'}-${index}`}
                                                                                                className="text-foreground"
                                                                                            >
                                                                                                {
                                                                                                    admin.name
                                                                                                }
                                                                                            </li>
                                                                                        ),
                                                                                    )}
                                                                                </ul>
                                                                            ) : (
                                                                                <p className="text-muted-foreground">
                                                                                    Belum
                                                                                    ada
                                                                                    admin
                                                                                    kolaborasi
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            ) : ticket
                                                                  .assignedAdmin
                                                                  ?.name ? (
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    Telah di
                                                                    Handle{' '}
                                                                    {
                                                                        ticket
                                                                            .assignedAdmin
                                                                            .name
                                                                    }
                                                                </span>
                                                            ) : (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-gray-100 text-gray-800"
                                                                >
                                                                    Belum di
                                                                    Handle
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setEstimateDialogTicket(
                                                                        ticket,
                                                                    )
                                                                }
                                                            >
                                                                Estimasi
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={11}
                                                    className="py-8 text-center"
                                                >
                                                    Tidak ada data bug ticket
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                            Total: {filteredTickets.length} bug ticket (
                            {dateRangeSummary})
                        </div>
                    </CardContent>
                </Card>
            </div>
            <TicketEstimateDialog
                open={Boolean(estimateDialogTicket)}
                onOpenChange={(open) => {
                    if (!open) {
                        setEstimateDialogTicket(null);
                    }
                }}
                ticket={estimateDialogTicket as TicketEstimateData}
                currentUserRole="developer"
                onUpdated={(updatedTicket) => {
                    const typedTicket = updatedTicket as BugTicket;

                    setTickets((prevTickets) =>
                        prevTickets.map((ticket) =>
                            ticket.id === typedTicket.id
                                ? normalizeTicket(typedTicket as ApiBugTicket)
                                : ticket,
                        ),
                    );
                    setEstimateDialogTicket(
                        normalizeTicket(typedTicket as ApiBugTicket),
                    );
                }}
            />
        </>
    );
}
