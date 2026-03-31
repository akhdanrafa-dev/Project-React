import { Head } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    formatTicketCompletedAt,
    formatTicketLocalDateTime,
    getTicketCompletedAt,
} from '@/lib/ticket-timing';

interface BugTicket {
    id: number;
    ticket_number?: string;
    title?: string;
    status: string;
    created_at: string;
    updated_at?: string;
    resolved_at?: string | null;
    collaboration_type?: string | null;
    collaborators?: Array<number | string> | null;
    collaborators_details?: Array<{
        id: number;
        name: string;
        email?: string;
    }> | null;
    assignedAdmin?: {
        id: number;
        name: string;
    } | null;
    assigned_admin?: {
        id: number;
        name: string;
    } | null;
    user?: {
        name?: string;
        email?: string;
    };
}

type DateSortOrder = 'newest_first' | 'oldest_first';

const MONTH_OPTIONS = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

const DATE_SORT_OPTIONS: Array<{ value: DateSortOrder; label: string }> = [
    { value: 'newest_first', label: 'Terbaru ke Terlama' },
    { value: 'oldest_first', label: 'Terlama ke Terbaru' },
];

const normalizeStatus = (status?: string) => status?.toLowerCase() ?? '';

const matchesMonthYearFilter = (
    dateValue: Date,
    monthValue: string,
    yearValue: string,
) => {
    const month = Number(monthValue);
    const year = Number(yearValue);
    if (!month || !year) return false;

    return (
        dateValue.getMonth() === month - 1 && dateValue.getFullYear() === year
    );
};

const getTicketAdminNames = (ticket: BugTicket) => {
    const names: string[] = [];

    const assignedAdminName =
        ticket.assignedAdmin?.name?.trim() || ticket.assigned_admin?.name?.trim();
    if (assignedAdminName) {
        names.push(assignedAdminName);
    }

    (ticket.collaborators_details ?? []).forEach((collaborator) => {
        const collaboratorName = collaborator?.name?.trim();
        if (collaboratorName) {
            names.push(collaboratorName);
        }
    });

    const uniqueNames = new Map<string, string>();
    names.forEach((name) => {
        const key = name.toLocaleLowerCase('id');
        if (!uniqueNames.has(key)) {
            uniqueNames.set(key, name);
        }
    });

    return Array.from(uniqueNames.values());
};

const getPeriodLabel = (monthValue: string, yearValue: string) => {
    const monthLabel =
        MONTH_OPTIONS.find((month) => month.value === monthValue)?.label ??
        monthValue;
    return `${monthLabel} ${yearValue}`;
};

export default function DeveloperClosedReportHistoryPage() {
    const { toast } = useToast();
    const [tickets, setTickets] = useState<BugTicket[]>([]);
    const [reportMonth, setReportMonth] = useState(() =>
        String(new Date().getMonth() + 1).padStart(2, '0'),
    );
    const [reportYear, setReportYear] = useState(() =>
        String(new Date().getFullYear()),
    );
    const [dateSortOrder, setDateSortOrder] =
        useState<DateSortOrder>('newest_first');
    const [adminFilter, setAdminFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const response = await fetch('/api/bug-tickets');
                if (!response.ok) throw new Error('Gagal mengambil ticket');

                const data = await response.json();
                setTickets(Array.isArray(data) ? (data as BugTicket[]) : []);
            } catch (error) {
                console.error('Error fetching tickets:', error);
                toast({
                    title: 'Error',
                    description: 'Gagal mengambil history tiket ditutup',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        void fetchTickets();
    }, [toast]);

    const closedTickets = useMemo(
        () => tickets.filter((ticket) => normalizeStatus(ticket.status) === 'closed'),
        [tickets],
    );

    const yearOptions = useMemo(() => {
        const years = new Set<string>([String(new Date().getFullYear())]);

        closedTickets.forEach((ticket) => {
            const closedAt = getTicketCompletedAt(ticket);
            if (closedAt) {
                years.add(String(closedAt.getFullYear()));
            }
        });

        return Array.from(years).sort((a, b) => Number(b) - Number(a));
    }, [closedTickets]);

    useEffect(() => {
        if (yearOptions.length > 0 && !yearOptions.includes(reportYear)) {
            setReportYear(yearOptions[0]);
        }
    }, [reportYear, yearOptions]);

    const adminOptions = useMemo(() => {
        const names = new Set<string>();

        closedTickets.forEach((ticket) => {
            getTicketAdminNames(ticket).forEach((name) => names.add(name));
        });

        return Array.from(names).sort((a, b) => a.localeCompare(b, 'id'));
    }, [closedTickets]);

    useEffect(() => {
        if (adminFilter !== 'all' && !adminOptions.includes(adminFilter)) {
            setAdminFilter('all');
        }
    }, [adminFilter, adminOptions]);

    const filteredClosedTickets = useMemo(() => {
        return closedTickets
            .filter((ticket) => {
                const closedAt = getTicketCompletedAt(ticket);
                if (!closedAt) return false;
                return matchesMonthYearFilter(closedAt, reportMonth, reportYear);
            })
            .filter((ticket) => {
                if (adminFilter === 'all') return true;
                return getTicketAdminNames(ticket).some(
                    (name) =>
                        name.localeCompare(adminFilter, 'id', {
                            sensitivity: 'accent',
                        }) === 0,
                );
            })
            .sort((a, b) => {
                const leftDate = getTicketCompletedAt(a)?.getTime() ?? 0;
                const rightDate = getTicketCompletedAt(b)?.getTime() ?? 0;
                const dateDiff = leftDate - rightDate;
                return dateSortOrder === 'oldest_first' ? dateDiff : -dateDiff;
            });
    }, [adminFilter, closedTickets, dateSortOrder, reportMonth, reportYear]);

    return (
        <RootLayout hideFloatingChat>
            <Head title="History Laporan Ditutup" />

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
                            <BreadcrumbLink href="/developer/history-laporan-ditutup">
                                History Ditutup
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>History Laporan Ditutup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={reportMonth}
                                onChange={(event) =>
                                    setReportMonth(event.target.value)
                                }
                                className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm text-black ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-white"
                                aria-label="Filter bulan history tiket ditutup"
                            >
                                {MONTH_OPTIONS.map((monthOption) => (
                                    <option
                                        key={monthOption.value}
                                        value={monthOption.value}
                                    >
                                        {monthOption.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={reportYear}
                                onChange={(event) =>
                                    setReportYear(event.target.value)
                                }
                                className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm text-black ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-white"
                                aria-label="Filter tahun history tiket ditutup"
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={dateSortOrder}
                                onChange={(event) =>
                                    setDateSortOrder(
                                        event.target.value as DateSortOrder,
                                    )
                                }
                                className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm text-black ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-white"
                                aria-label="Urutkan tanggal history tiket ditutup"
                            >
                                {DATE_SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={adminFilter}
                                onChange={(event) =>
                                    setAdminFilter(event.target.value)
                                }
                                className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm text-black ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-white"
                                aria-label="Filter nama admin pada history tiket ditutup"
                            >
                                <option value="all">Semua Admin</option>
                                {adminOptions.map((adminName) => (
                                    <option key={adminName} value={adminName}>
                                        {adminName}
                                    </option>
                                ))}
                            </select>

                            <div className="ml-auto text-sm text-muted-foreground">
                                Periode: {getPeriodLabel(reportMonth, reportYear)} |
                                Admin: {adminFilter === 'all' ? ' Semua' : ` ${adminFilter}`}
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Nomor Tiket</TableHead>
                                        <TableHead>Judul</TableHead>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Pelapor</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Waktu Masuk</TableHead>
                                        <TableHead>Waktu Selesai</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Memuat history...
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredClosedTickets.length > 0 ? (
                                        filteredClosedTickets.map((ticket, index) => (
                                            <TableRow
                                                key={`closed-ticket-${ticket.id}-${index}`}
                                            >
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{ticket.id}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {ticket.ticket_number || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.title || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {getTicketAdminNames(ticket).join(', ') ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.user?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.user?.email || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {formatTicketLocalDateTime(
                                                        ticket.created_at,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatTicketCompletedAt(ticket)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada history laporan ditutup
                                                pada filter ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Total history ditutup: {filteredClosedTickets.length}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </RootLayout>
    );
}
