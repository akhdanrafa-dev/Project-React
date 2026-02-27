import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    XAxis,
    YAxis,
} from 'recharts';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-trigger';
import { useToast } from '@/components/ui/use-toast';
import RootLayout from '@/layouts/app/RootLayouts';

interface BugTicket {
    id: number;
    ticket_number?: string;
    title?: string;
    priority?: string;
    difficulty_level?: string | null;
    status: string;
    created_at: string;
    user?: {
        name?: string;
        email?: string;
    };
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';
type TicketStatus = Exclude<StatusFilter, 'all'>;

type AppliedReportFilter = {
    startDate: string;
    endDate: string;
    status: StatusFilter;
};

const REPORT_STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
    open: {
        label: 'Terbuka',
        color: '#f97316',
    },
    in_progress: {
        label: 'Dalam Proses',
        color: '#3b82f6',
    },
    resolved: {
        label: 'Terselesaikan',
        color: '#22c55e',
    },
};

const REPORT_CHART_CONFIG = {
    total: {
        label: 'Jumlah Laporan',
    },
} satisfies ChartConfig;

const normalizeStatus = (status?: string) => status?.toLowerCase() ?? '';

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

const formatDateInputForDisplay = (value: string) => {
    const parsedDate = parseDateInput(value);
    if (!parsedDate) return value;

    return parsedDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

const getReportStatusLabel = (status: StatusFilter) =>
    status === 'all' ? 'Semua status' : REPORT_STATUS_META[status].label;

const getTicketStatusLabel = (status?: string) => {
    const normalized = normalizeStatus(status);

    if (normalized in REPORT_STATUS_META) {
        return REPORT_STATUS_META[normalized as TicketStatus].label;
    }

    if (normalized === 'closed') return 'Ditutup';
    if (normalized === 'diproses kembali') return 'Diproses Kembali';

    return status || '-';
};

const getPriorityLabel = (priority?: string) => {
    const normalized = normalizeStatus(priority);

    if (normalized === 'high') return 'Tinggi';
    if (normalized === 'medium') return 'Sedang';
    if (normalized === 'low') return 'Rendah';

    return priority || '-';
};

const getDifficultyLabel = (difficulty?: string | null) => {
    const normalized = normalizeStatus(difficulty ?? '');

    if (normalized === 'easy') return 'Mudah';
    if (normalized === 'medium') return 'Sedang';
    if (normalized === 'hard') return 'Sulit';

    return difficulty || '-';
};

const formatDateTimeForDisplay = (value: string) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return '-';

    return parsedDate.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const escapeExcelCell = (value: string | number) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export default function DeveloperPeriodReportPage() {
    return (
        <RootLayout hideFloatingChat>
            <DeveloperPeriodReportContent />
        </RootLayout>
    );
}

function DeveloperPeriodReportContent() {
    const { toast } = useToast();
    const [tickets, setTickets] = useState<BugTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportStatusFilter, setReportStatusFilter] =
        useState<StatusFilter>('all');
    const [appliedReportFilter, setAppliedReportFilter] =
        useState<AppliedReportFilter | null>(null);

    const fetchTickets = async () => {
        try {
            const response = await fetch('/api/bug-tickets');
            if (!response.ok) throw new Error('Gagal mengambil ticket');

            const data = await response.json();
            const normalizedTickets = Array.isArray(data)
                ? (data as BugTicket[])
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
    };

    useEffect(() => {
        void fetchTickets();
    }, []);

    const activeTickets = useMemo(
        () =>
            tickets.filter((ticket) => normalizeStatus(ticket.status) !== 'closed'),
        [tickets],
    );

    const handleApplyReportFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!reportStartDate || !reportEndDate) {
            toast({
                title: 'Input belum lengkap',
                description: 'Mohon isi tanggal awal dan tanggal akhir periode.',
                variant: 'destructive',
            });
            return;
        }

        const startDate = parseDateInput(reportStartDate);
        const endDate = parseDateInput(reportEndDate, true);

        if (!startDate || !endDate) {
            toast({
                title: 'Tanggal tidak valid',
                description: 'Format tanggal periode tidak valid.',
                variant: 'destructive',
            });
            return;
        }

        if (startDate.getTime() > endDate.getTime()) {
            toast({
                title: 'Periode tidak valid',
                description:
                    'Tanggal awal harus lebih kecil atau sama dengan tanggal akhir.',
                variant: 'destructive',
            });
            return;
        }

        setAppliedReportFilter({
            startDate: reportStartDate,
            endDate: reportEndDate,
            status: reportStatusFilter,
        });
    };

    const reportTicketsInPeriod = useMemo(() => {
        if (!appliedReportFilter) return [];

        const startDate = parseDateInput(appliedReportFilter.startDate);
        const endDate = parseDateInput(appliedReportFilter.endDate, true);
        if (!startDate || !endDate) return [];

        return activeTickets.filter((ticket) => {
            const createdAt = new Date(ticket.created_at);
            if (Number.isNaN(createdAt.getTime())) return false;

            return (
                createdAt.getTime() >= startDate.getTime() &&
                createdAt.getTime() <= endDate.getTime()
            );
        });
    }, [activeTickets, appliedReportFilter]);

    const reportStatusCounts = useMemo(() => {
        const open = reportTicketsInPeriod.filter(
            (ticket) => normalizeStatus(ticket.status) === 'open',
        ).length;
        const inProgress = reportTicketsInPeriod.filter(
            (ticket) => normalizeStatus(ticket.status) === 'in_progress',
        ).length;
        const resolved = reportTicketsInPeriod.filter(
            (ticket) => normalizeStatus(ticket.status) === 'resolved',
        ).length;

        return {
            all: reportTicketsInPeriod.length,
            open,
            in_progress: inProgress,
            resolved,
        };
    }, [reportTicketsInPeriod]);

    const reportTicketsBySelectedStatus = useMemo(() => {
        if (!appliedReportFilter) return [];

        if (appliedReportFilter.status === 'all') {
            return reportTicketsInPeriod;
        }

        return reportTicketsInPeriod.filter(
            (ticket) =>
                normalizeStatus(ticket.status) === appliedReportFilter.status,
        );
    }, [appliedReportFilter, reportTicketsInPeriod]);

    const reportChartData = useMemo(() => {
        if (!appliedReportFilter) return [];

        const data = (Object.keys(REPORT_STATUS_META) as TicketStatus[]).map(
            (status) => ({
                status,
                label: REPORT_STATUS_META[status].label,
                total: reportStatusCounts[status],
                color: REPORT_STATUS_META[status].color,
            }),
        );

        if (appliedReportFilter.status === 'all') return data;
        return data.filter((item) => item.status === appliedReportFilter.status);
    }, [appliedReportFilter, reportStatusCounts]);

    const selectedStatusTotal = useMemo(() => {
        return reportTicketsBySelectedStatus.length;
    }, [reportTicketsBySelectedStatus]);

    const handleDownloadExcel = () => {
        if (!appliedReportFilter) {
            toast({
                title: 'Filter belum diterapkan',
                description:
                    'Masukkan tanggal periode lalu klik "Tampilkan Diagram" terlebih dahulu.',
                variant: 'destructive',
            });
            return;
        }

        const tableHeaders = [
            'No',
            'ID',
            'Nomor Tiket',
            'Judul',
            'Pelapor',
            'Email',
            'Prioritas',
            'Kesulitan',
            'Status',
            'Tanggal Laporan',
        ];

        const headerHtml = tableHeaders
            .map(
                (header) =>
                    `<th style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;font-weight:700;">${escapeExcelCell(
                        header,
                    )}</th>`,
            )
            .join('');

        const bodyHtml =
            reportTicketsBySelectedStatus.length > 0
                ? reportTicketsBySelectedStatus
                      .map((ticket, index) => {
                          const row = [
                              index + 1,
                              ticket.id,
                              ticket.ticket_number || '-',
                              ticket.title || '-',
                              ticket.user?.name || '-',
                              ticket.user?.email || '-',
                              getPriorityLabel(ticket.priority),
                              getDifficultyLabel(ticket.difficulty_level),
                              getTicketStatusLabel(ticket.status),
                              formatDateTimeForDisplay(ticket.created_at),
                          ];

                          const cells = row
                              .map(
                                  (value) =>
                                      `<td style="border:1px solid #d1d5db;padding:8px;">${escapeExcelCell(
                                          value,
                                      )}</td>`,
                              )
                              .join('');

                          return `<tr>${cells}</tr>`;
                      })
                      .join('')
                : `<tr><td colspan="${tableHeaders.length}" style="border:1px solid #d1d5db;padding:8px;text-align:center;">Tidak ada data pada periode dan status yang dipilih.</td></tr>`;

        const excelHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8" />
                    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan Periode</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                </head>
                <body>
                    <table style="border-collapse:collapse;margin-bottom:12px;">
                        <tr><td><strong>Laporan Periode Developer</strong></td></tr>
                        <tr><td>Periode: ${escapeExcelCell(formatDateInputForDisplay(appliedReportFilter.startDate))} - ${escapeExcelCell(formatDateInputForDisplay(appliedReportFilter.endDate))}</td></tr>
                        <tr><td>Status: ${escapeExcelCell(getReportStatusLabel(appliedReportFilter.status))}</td></tr>
                        <tr><td>Total Laporan: ${escapeExcelCell(selectedStatusTotal)}</td></tr>
                    </table>
                    <table style="border-collapse:collapse;">
                        <thead>
                            <tr>${headerHtml}</tr>
                        </thead>
                        <tbody>
                            ${bodyHtml}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', excelHtml], {
            type: 'application/vnd.ms-excel;charset=utf-8;',
        });
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const startDate = appliedReportFilter.startDate.replace(/-/g, '');
        const endDate = appliedReportFilter.endDate.replace(/-/g, '');

        link.href = blobUrl;
        link.download = `laporan-periode-${startDate}-${endDate}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        toast({
            title: 'Berhasil',
            description: 'File Excel laporan periode berhasil diunduh.',
        });
    };

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
                            <BreadcrumbLink href="/laporan">Laporan</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/developer/laporan-periode">
                                Laporan Periode
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Laporan Periode</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form
                            onSubmit={handleApplyReportFilter}
                            className="grid gap-4 md:grid-cols-4"
                        >
                            <div className="space-y-2">
                                <label
                                    htmlFor="report-start-date"
                                    className="text-sm text-muted-foreground"
                                >
                                    Tanggal Awal
                                </label>
                                <Input
                                    id="report-start-date"
                                    type="date"
                                    value={reportStartDate}
                                    onChange={(event) =>
                                        setReportStartDate(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="report-end-date"
                                    className="text-sm text-muted-foreground"
                                >
                                    Tanggal Akhir
                                </label>
                                <Input
                                    id="report-end-date"
                                    type="date"
                                    value={reportEndDate}
                                    onChange={(event) =>
                                        setReportEndDate(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="report-status-filter"
                                    className="text-sm text-muted-foreground"
                                >
                                    Status Laporan
                                </label>
                                <select
                                    id="report-status-filter"
                                    value={reportStatusFilter}
                                    onChange={(event) =>
                                        setReportStatusFilter(
                                            event.target.value as StatusFilter,
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-black ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-white"
                                    aria-label="Pilih status laporan"
                                >
                                    <option value="all">Semua status</option>
                                    <option value="open">Terbuka</option>
                                    <option value="in_progress">
                                        Dalam Proses
                                    </option>
                                    <option value="resolved">Terselesaikan</option>
                                </select>
                            </div>

                            <div className="flex items-end gap-2">
                                <Button type="submit" className="w-full md:w-auto">
                                    Tampilkan Diagram
                                </Button>
                            </div>
                        </form>

                        <div className="relative rounded-lg border p-4 pb-14">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium">
                                    Diagram Batang Laporan
                                </p>
                                {appliedReportFilter ? (
                                    <p className="text-xs text-muted-foreground">
                                        {formatDateInputForDisplay(
                                            appliedReportFilter.startDate,
                                        )}{' '}
                                        -{' '}
                                        {formatDateInputForDisplay(
                                            appliedReportFilter.endDate,
                                        )}{' '}
                                        | Status:{' '}
                                        {getReportStatusLabel(
                                            appliedReportFilter.status,
                                        )}
                                    </p>
                                ) : null}
                            </div>

                            <div className="h-[320px] w-full">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        Memuat data laporan...
                                    </div>
                                ) : !appliedReportFilter ? (
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        Mohon masukkan tanggal periode
                                    </div>
                                ) : reportChartData.some(
                                      (item) => item.total > 0,
                                  ) ? (
                                    <ChartContainer
                                        config={REPORT_CHART_CONFIG}
                                        className="aspect-auto h-full w-full"
                                    >
                                        <BarChart
                                            accessibilityLayer
                                            data={reportChartData}
                                            margin={{
                                                left: 8,
                                                right: 8,
                                            }}
                                        >
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="label"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={
                                                    <ChartTooltipContent
                                                        hideLabel
                                                        formatter={(
                                                            value,
                                                            _name,
                                                            item,
                                                        ) => (
                                                            <div className="flex w-full items-center justify-between gap-2">
                                                                <span className="text-muted-foreground">
                                                                    {
                                                                        item
                                                                            ?.payload
                                                                            ?.label
                                                                    }
                                                                </span>
                                                                <span className="font-mono font-medium tabular-nums">
                                                                    {Number(
                                                                        value,
                                                                    ).toLocaleString()}{' '}
                                                                    laporan
                                                                </span>
                                                            </div>
                                                        )}
                                                    />
                                                }
                                            />
                                            <Bar
                                                dataKey="total"
                                                radius={[8, 8, 0, 0]}
                                            >
                                                {reportChartData.map((entry) => (
                                                    <Cell
                                                        key={entry.status}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        Tidak ada laporan pada periode yang
                                        dipilih.
                                    </div>
                                )}
                            </div>

                            {appliedReportFilter ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="absolute right-4 bottom-4"
                                    onClick={handleDownloadExcel}
                                >
                                    Unduh Excel
                                </Button>
                            ) : null}
                        </div>

                        {appliedReportFilter ? (
                            <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-lg border p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Total Periode
                                        </p>
                                        <p className="text-2xl font-semibold">
                                            {reportStatusCounts.all}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Terbuka
                                        </p>
                                        <p className="text-2xl font-semibold">
                                            {reportStatusCounts.open}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Dalam Proses
                                        </p>
                                        <p className="text-2xl font-semibold">
                                            {reportStatusCounts.in_progress}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-xs text-muted-foreground">
                                            Terselesaikan
                                        </p>
                                        <p className="text-2xl font-semibold">
                                            {reportStatusCounts.resolved}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    Jumlah laporan sesuai status terpilih:{' '}
                                    <span className="font-semibold text-foreground">
                                        {selectedStatusTotal}
                                    </span>
                                </p>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
