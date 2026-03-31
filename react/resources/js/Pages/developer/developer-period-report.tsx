import { Loader2 } from 'lucide-react';
import {
    ChangeEvent,
    DragEvent,
    KeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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
import { normalizeTicketStatus, TICKET_STATUS } from '@/lib/ticket-status';

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

type TicketStatus = 'open' | 'pending_estimate' | 'in_progress' | 'resolved';
type DateSortOrder = 'newest_first' | 'oldest_first';

type ParsedImportResult = {
    tickets: BugTicket[];
    skippedRows: number;
};

type ParseImportedRowsOptions = {
    nextIdStart?: number;
    reservedIds?: number[];
};

const REPORT_STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
    open: {
        label: 'Terbuka',
        color: '#f97316',
    },
    pending_estimate: {
        label: 'Menunggu Estimasi Pengerjaan',
        color: '#f59e0b',
    },
    in_progress: {
        label: 'Sedang Diproses',
        color: '#3b82f6',
    },
    resolved: {
        label: 'Menunggu Verifikasi',
        color: '#22c55e',
    },
};

const REPORT_CHART_CONFIG = {
    total: {
        label: 'Jumlah Laporan',
    },
} satisfies ChartConfig;

const MASTER_TEMPLATE_HEADERS = [
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

const normalizeStatus = (status?: string) => normalizeTicketStatus(status);

const normalizeHeader = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const getPeriodLabel = (monthValue: string, yearValue: string) => {
    const monthLabel =
        MONTH_OPTIONS.find((month) => month.value === monthValue)?.label ??
        monthValue;
    return `${monthLabel} ${yearValue}`;
};

const matchesMonthYearFilter = (
    createdAt: Date,
    monthValue: string,
    yearValue: string,
) => {
    const month = Number(monthValue);
    const year = Number(yearValue);
    if (!month || !year) return false;

    return createdAt.getMonth() === month - 1 && createdAt.getFullYear() === year;
};

const parseCsvLine = (line: string, delimiter = ',') => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === delimiter && !inQuotes) {
            cells.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    cells.push(current.trim());
    return cells;
};

const detectCsvDelimiter = (lines: string[]) => {
    const sampleLines = lines.filter((line) => line.trim() !== '').slice(0, 10);
    if (sampleLines.length === 0) return ',';

    const candidates = [',', ';', '\t'] as const;
    let selectedDelimiter: (typeof candidates)[number] = ',';
    let bestScore = -1;

    candidates.forEach((candidate) => {
        const parsedColumns = sampleLines.map(
            (line) => parseCsvLine(line, candidate).length,
        );
        const rowsWithMultipleColumns = parsedColumns.filter(
            (columnCount) => columnCount > 1,
        ).length;
        const averageColumns =
            parsedColumns.reduce((total, columnCount) => total + columnCount, 0) /
            parsedColumns.length;
        const score = rowsWithMultipleColumns * 100 + averageColumns;

        if (score > bestScore) {
            bestScore = score;
            selectedDelimiter = candidate;
        }
    });

    return selectedDelimiter;
};

const parseCsvText = (text: string) => {
    const sanitizedText = text.replace(/^\uFEFF/, '');
    const lines = sanitizedText.split(/\r?\n/);
    const delimiter = detectCsvDelimiter(lines);

    return lines
        .map((line) => parseCsvLine(line.replace(/^\uFEFF/, ''), delimiter))
        .filter((row) => row.some((cell) => cell.trim() !== ''));
};
const extractRowsFromHtmlTable = (text: string) => {
    const documentParser = new DOMParser().parseFromString(text, 'text/html');
    const tables = Array.from(documentParser.querySelectorAll('table'));

    for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
            Array.from(row.querySelectorAll('th,td')).map(
                (cell) => cell.textContent?.trim() ?? '',
            ),
        );

        if (rows.length === 0) continue;

        const hasStatusHeader = rows.some((row) =>
            row.some((cell) => normalizeHeader(cell) === 'status'),
        );

        if (hasStatusHeader) {
            return rows;
        }
    }

    return [];
};

const parseDateTimeFromImport = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return new Date().toISOString();

    if (/^\d+(\.\d+)?$/.test(trimmed)) {
        const excelSerial = Number(trimmed);
        if (excelSerial > 20000 && excelSerial < 80000) {
            const utcMillis = Math.round((excelSerial - 25569) * 86400 * 1000);
            const fromSerial = new Date(utcMillis);
            if (!Number.isNaN(fromSerial.getTime())) {
                return fromSerial.toISOString();
            }
        }
    }

    const dayMonthYearMatch = trimmed.match(
        /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/,
    );

    if (dayMonthYearMatch) {
        const [, dayRaw, monthRaw, yearRaw, hourRaw = '0', minuteRaw = '0'] =
            dayMonthYearMatch;
        const year =
            yearRaw.length === 2 ? Number(`20${yearRaw}`) : Number(yearRaw);
        const month = Number(monthRaw);
        const day = Number(dayRaw);
        const hour = Number(hourRaw);
        const minute = Number(minuteRaw);

        const parsedDate = new Date(year, month - 1, day, hour, minute, 0, 0);
        if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString();
        }
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
    }

    return new Date().toISOString();
};

const normalizeImportedStatus = (value: string): string => {
    const normalized = normalizeHeader(value);

    if (['open', 'terbuka'].includes(normalized)) return 'open';
    if (
        [
            'pending_estimate',
            'pendingestimate',
            'belum_diproses',
            'belumdiproses',
        ].includes(normalized)
    ) {
        return 'pending_estimate';
    }
    if (
        [
            'in_progress',
            'inprogress',
            'dalam_proses',
            'dalamproses',
            'proses',
        ].includes(normalized)
    ) {
        return 'in_progress';
    }
    if (['resolved', 'terselesaikan', 'selesai'].includes(normalized)) {
        return 'resolved';
    }
    if (['closed', 'ditutup'].includes(normalized)) return 'closed';
    if (normalized === 'diproses_kembali') return 'diproses kembali';

    return 'open';
};

const normalizeImportedPriority = (value: string): string => {
    const normalized = normalizeHeader(value);
    if (['high', 'tinggi', 'urgent'].includes(normalized)) return 'high';
    if (['medium', 'sedang', 'normal'].includes(normalized)) return 'medium';
    if (['low', 'rendah'].includes(normalized)) return 'low';
    return 'medium';
};

const normalizeImportedDifficulty = (value: string): string | null => {
    const normalized = normalizeHeader(value);
    if (['easy', 'mudah'].includes(normalized)) return 'easy';
    if (['medium', 'sedang'].includes(normalized)) return 'medium';
    if (['hard', 'sulit'].includes(normalized)) return 'hard';
    return null;
};

const findColumnIndex = (headers: string[], aliases: string[]) =>
    headers.findIndex((header) => aliases.includes(header));

const parseImportedRows = (
    rows: string[][],
    options: ParseImportedRowsOptions = {},
): ParsedImportResult => {
    if (rows.length === 0) {
        return { tickets: [], skippedRows: 0 };
    }

    const headerRowIndex = rows.findIndex((row) => {
        const normalized = row.map((cell) => normalizeHeader(cell));
        return (
            normalized.includes('status') &&
            (normalized.includes('nomor_tiket') ||
                normalized.includes('ticket_number') ||
                normalized.includes('judul') ||
                normalized.includes('title'))
        );
    });

    const effectiveHeaderIndex = headerRowIndex >= 0 ? headerRowIndex : 0;
    const normalizedHeaders = rows[effectiveHeaderIndex].map((cell) =>
        normalizeHeader(cell),
    );
    const dataRows = rows.slice(effectiveHeaderIndex + 1);

    const indexes = {
        id: findColumnIndex(normalizedHeaders, ['id']),
        ticketNumber: findColumnIndex(normalizedHeaders, [
            'nomor_tiket',
            'ticket_number',
            'nomor',
        ]),
        title: findColumnIndex(normalizedHeaders, ['judul', 'title']),
        reporter: findColumnIndex(normalizedHeaders, [
            'pelapor',
            'reporter',
            'username',
            'nama',
        ]),
        email: findColumnIndex(normalizedHeaders, ['email']),
        priority: findColumnIndex(normalizedHeaders, ['prioritas', 'priority']),
        difficulty: findColumnIndex(normalizedHeaders, [
            'kesulitan',
            'difficulty',
            'difficulty_level',
        ]),
        status: findColumnIndex(normalizedHeaders, ['status']),
        createdAt: findColumnIndex(normalizedHeaders, [
            'tanggal_laporan',
            'tanggal',
            'created_at',
            'waktu_laporan',
        ]),
    };

    const useFixedPositions = Object.values(indexes).every((value) => value < 0);

    const readCell = (row: string[], index: number, fallbackIndex: number) => {
        const resolvedIndex = useFixedPositions ? fallbackIndex : index;
        return resolvedIndex >= 0 ? (row[resolvedIndex] ?? '').trim() : '';
    };

    const parsedTickets: BugTicket[] = [];
    let skippedRows = 0;
    const usedIds = new Set<number>(
        (options.reservedIds ?? []).filter(
            (value) => Number.isFinite(value) && value > 0,
        ),
    );
    let nextGeneratedId = Math.max(1, options.nextIdStart ?? 1);

    const generateNextAvailableId = () => {
        while (usedIds.has(nextGeneratedId)) {
            nextGeneratedId += 1;
        }

        const generatedId = nextGeneratedId;
        usedIds.add(generatedId);
        nextGeneratedId += 1;
        return generatedId;
    };

    const resolveImportedId = (idRaw: string) => {
        const parsedId = Number(idRaw);
        if (
            Number.isFinite(parsedId) &&
            parsedId > 0 &&
            !usedIds.has(parsedId)
        ) {
            usedIds.add(parsedId);
            if (parsedId >= nextGeneratedId) {
                nextGeneratedId = parsedId + 1;
            }
            return parsedId;
        }

        return generateNextAvailableId();
    };

    dataRows.forEach((row, rowIndex) => {
        const isEmptyRow = row.every((cell) => cell.trim() === '');
        if (isEmptyRow) {
            skippedRows += 1;
            return;
        }

        const idRaw = readCell(row, indexes.id, 0);
        const ticketNumberRaw = readCell(row, indexes.ticketNumber, 1);
        const titleRaw = readCell(row, indexes.title, 2);
        const reporterRaw = readCell(row, indexes.reporter, 3);
        const emailRaw = readCell(row, indexes.email, 4);
        const priorityRaw = readCell(row, indexes.priority, 5);
        const difficultyRaw = readCell(row, indexes.difficulty, 6);
        const statusRaw = readCell(row, indexes.status, 7);
        const createdAtRaw = readCell(row, indexes.createdAt, 8);

        const id = resolveImportedId(idRaw);

        parsedTickets.push({
            id,
            ticket_number: ticketNumberRaw || `IMP-${rowIndex + 1}`,
            title: titleRaw || '-',
            priority: normalizeImportedPriority(priorityRaw),
            difficulty_level: normalizeImportedDifficulty(difficultyRaw),
            status: normalizeImportedStatus(statusRaw),
            created_at: parseDateTimeFromImport(createdAtRaw),
            user: {
                name: reporterRaw || '-',
                email: emailRaw || '-',
            },
        });
    });

    return {
        tickets: parsedTickets,
        skippedRows,
    };
};
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
    const [importedTickets, setImportedTickets] = useState<BugTicket[] | null>(
        null,
    );
    const [reportMonth, setReportMonth] = useState(() =>
        String(new Date().getMonth() + 1).padStart(2, '0'),
    );
    const [reportYear, setReportYear] = useState(() =>
        String(new Date().getFullYear()),
    );
    const [dateSortOrder, setDateSortOrder] =
        useState<DateSortOrder>('newest_first');
    const [loading, setLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [isApplyingImport, setIsApplyingImport] = useState(false);
    const [isDragOverImportZone, setIsDragOverImportZone] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const activeSystemTickets = useMemo(
        () =>
            tickets.filter((ticket) => normalizeStatus(ticket.status) !== 'closed'),
        [tickets],
    );
    const sourceTickets = importedTickets ?? activeSystemTickets;
    const systemTicketIds = useMemo(
        () =>
            tickets
                .map((ticket) => Number(ticket.id))
                .filter((id) => Number.isFinite(id) && id > 0),
        [tickets],
    );
    const nextSystemTicketId = useMemo(
        () =>
            systemTicketIds.reduce(
                (maxId, currentId) =>
                    currentId > maxId ? currentId : maxId,
                0,
            ) + 1,
        [systemTicketIds],
    );

    const yearOptions = useMemo(() => {
        const years = new Set<string>([String(new Date().getFullYear())]);

        sourceTickets.forEach((ticket) => {
            const createdAt = new Date(ticket.created_at);
            if (!Number.isNaN(createdAt.getTime())) {
                years.add(String(createdAt.getFullYear()));
            }
        });

        return Array.from(years).sort((a, b) => Number(b) - Number(a));
    }, [sourceTickets]);

    useEffect(() => {
        if (yearOptions.length > 0 && !yearOptions.includes(reportYear)) {
            setReportYear(yearOptions[0]);
        }
    }, [reportYear, yearOptions]);

    const reportTickets = useMemo(() => {
        return sourceTickets
            .filter((ticket) => normalizeStatus(ticket.status) !== 'closed')
            .filter((ticket) => {
                const createdAt = new Date(ticket.created_at);
                if (Number.isNaN(createdAt.getTime())) return false;
                return matchesMonthYearFilter(createdAt, reportMonth, reportYear);
            })
            .sort((a, b) => {
                const dateDiff =
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime();
                return dateSortOrder === 'oldest_first' ? dateDiff : -dateDiff;
            });
    }, [dateSortOrder, reportMonth, reportYear, sourceTickets]);

    const reportStatusCounts = useMemo(() => {
        const open = reportTickets.filter(
            (ticket) => normalizeStatus(ticket.status) === TICKET_STATUS.OPEN,
        ).length;
        const pendingEstimate = reportTickets.filter(
            (ticket) =>
                normalizeStatus(ticket.status) ===
                TICKET_STATUS.PENDING_ESTIMATE,
        ).length;
        const inProgress = reportTickets.filter(
            (ticket) => normalizeStatus(ticket.status) === TICKET_STATUS.IN_PROGRESS,
        ).length;
        const resolved = reportTickets.filter(
            (ticket) => normalizeStatus(ticket.status) === TICKET_STATUS.RESOLVED,
        ).length;

        return {
            all: reportTickets.length,
            open,
            pending_estimate: pendingEstimate,
            in_progress: inProgress,
            resolved,
        };
    }, [reportTickets]);

    const reportChartData = useMemo(
        () =>
            (Object.keys(REPORT_STATUS_META) as TicketStatus[]).map((status) => ({
                status,
                label: REPORT_STATUS_META[status].label,
                total: reportStatusCounts[status],
                color: REPORT_STATUS_META[status].color,
            })),
        [reportStatusCounts],
    );

    const reportSourceLabel = importedTickets
        ? 'Data import excel'
        : 'Data sistem';
    const reportSortLabel =
        dateSortOrder === 'oldest_first'
            ? 'Terlama ke Terbaru'
            : 'Terbaru ke Terlama';
    const filterDescription = getPeriodLabel(reportMonth, reportYear);

    const downloadExcelFile = (fileName: string, html: string) => {
        const blob = new Blob(['\ufeff', html], {
            type: 'application/vnd.ms-excel;charset=utf-8;',
        });
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    };

    const handleDownloadMasterTemplate = () => {
        const headerHtml = MASTER_TEMPLATE_HEADERS.map(
            (header) =>
                `<th style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6;font-weight:700;">${escapeExcelCell(
                    header,
                )}</th>`,
        ).join('');

        const emptyRowHtml = MASTER_TEMPLATE_HEADERS.map(
            () =>
                '<td style="border:1px solid #d1d5db;padding:8px;">&nbsp;</td>',
        ).join('');

        const excelHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8" />
                    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Master Kosong</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                </head>
                <body>
                    <table style="border-collapse:collapse;margin-bottom:12px;">
                        <tr><td><strong>Master Data Laporan Periode (Kosong)</strong></td></tr>
                        <tr><td>Isi data sesuai kolom, lalu simpan sebagai .xls atau .csv untuk di-import.</td></tr>
                        <tr><td>Kolom ID boleh dikosongkan. Saat import, ID otomatis lanjut dari ID tiket terakhir.</td></tr>
                    </table>
                    <table style="border-collapse:collapse;">
                        <thead>
                            <tr>${headerHtml}</tr>
                        </thead>
                        <tbody>
                            <tr>${emptyRowHtml}</tr>
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        downloadExcelFile('master-laporan-periode-kosong.xls', excelHtml);

        toast({
            title: 'Berhasil',
            description: 'Master kosong berhasil diunduh.',
        });
    };

    const handleDownloadExcel = () => {
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
            reportTickets.length > 0
                ? reportTickets
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
                : `<tr><td colspan="${tableHeaders.length}" style="border:1px solid #d1d5db;padding:8px;text-align:center;">Tidak ada data laporan.</td></tr>`;

        const excelHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8" />
                    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan Periode</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                </head>
                <body>
                    <table style="border-collapse:collapse;margin-bottom:12px;">
                        <tr><td><strong>Laporan Periode Developer</strong></td></tr>
                        <tr><td>Sumber Data: ${escapeExcelCell(reportSourceLabel)}</td></tr>
                        <tr><td>Periode Filter: ${escapeExcelCell(filterDescription)}</td></tr>
                        <tr><td>Urutan Data: ${escapeExcelCell(reportSortLabel)}</td></tr>
                        <tr><td>Total Laporan: ${escapeExcelCell(reportTickets.length)}</td></tr>
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

        downloadExcelFile('laporan-periode-export.xls', excelHtml);

        toast({
            title: 'Berhasil',
            description: 'Export data laporan berhasil diunduh.',
        });
    };

    const importTicketsFromFile = async (file: File) => {
        setIsImporting(true);

        try {
            const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

            if (extension === 'xlsx') {
                throw new Error(
                    'Format .xlsx belum didukung. Gunakan file .xls template atau .csv.',
                );
            }

            const textContent = await file.text();
            const rows =
                extension === 'csv'
                    ? parseCsvText(textContent)
                    : extractRowsFromHtmlTable(textContent);

            const resolvedRows =
                rows.length > 0 ? rows : parseCsvText(textContent);

            const parsedResult = parseImportedRows(resolvedRows, {
                nextIdStart: nextSystemTicketId,
                reservedIds: systemTicketIds,
            });

            if (parsedResult.tickets.length === 0) {
                throw new Error(
                    'Tidak ada data valid yang dapat diimport dari file tersebut.',
                );
            }

            setImportedTickets(parsedResult.tickets);

            const skippedText =
                parsedResult.skippedRows > 0
                    ? `, ${parsedResult.skippedRows} baris dilewati`
                    : '';

            toast({
                title: 'Import berhasil',
                description: `${parsedResult.tickets.length} tiket berhasil diimport${skippedText}.`,
            });
        } catch (error) {
            toast({
                title: 'Import gagal',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Terjadi kesalahan saat import file.',
                variant: 'destructive',
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        await importTicketsFromFile(file);
        event.target.value = '';
    };

    const handleImportDragEnter = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOverImportZone(true);
    };

    const handleImportDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOverImportZone(true);
    };

    const handleImportDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        const nextTarget = event.relatedTarget;
        if (
            nextTarget instanceof Node &&
            event.currentTarget.contains(nextTarget)
        ) {
            return;
        }

        setIsDragOverImportZone(false);
    };

    const handleImportDrop = async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOverImportZone(false);

        const file = event.dataTransfer.files?.[0];
        if (!file) return;

        await importTicketsFromFile(file);
    };

    const handleImportZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
        }
    };

    const handleKeepImportedData = async () => {
        if (!importedTickets) return;

        const importedTicketsInSelectedPeriod = importedTickets.filter((ticket) => {
            const createdAt = new Date(ticket.created_at);
            if (Number.isNaN(createdAt.getTime())) return false;
            return matchesMonthYearFilter(createdAt, reportMonth, reportYear);
        });

        if (importedTicketsInSelectedPeriod.length === 0) {
            toast({
                title: 'Tidak ada data untuk disimpan',
                description:
                    'Data import tidak memiliki tiket pada bulan/tahun filter yang dipilih.',
                variant: 'destructive',
            });
            return;
        }

        setIsApplyingImport(true);

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') ?? '';
            const xsrfTokenCookie = document.cookie
                .split('; ')
                .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            const xsrfToken = xsrfTokenCookie
                ? decodeURIComponent(xsrfTokenCookie)
                : '';

            const response = await fetch('/api/bug-tickets/replace-period-import', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                },
                body: JSON.stringify({
                    month: Number(reportMonth),
                    year: Number(reportYear),
                    tickets: importedTicketsInSelectedPeriod.map((ticket) => ({
                        ticket_number: ticket.ticket_number ?? null,
                        title: ticket.title ?? null,
                        priority: ticket.priority ?? 'medium',
                        difficulty_level: ticket.difficulty_level ?? null,
                        status: ticket.status ?? 'open',
                        created_at: ticket.created_at,
                        user: {
                            name: ticket.user?.name ?? null,
                            email: ticket.user?.email ?? null,
                        },
                    })),
                }),
            });

            const responseBody = await response.text();
            let result: {
                message?: string;
                deleted_count?: number;
                created_count?: number;
            } = {};

            try {
                result =
                    responseBody.trim() !== ''
                        ? (JSON.parse(responseBody) as typeof result)
                        : {};
            } catch {
                result = {
                    message:
                        responseBody.trim() ||
                        'Gagal menyimpan data import ke database.',
                };
            }

            if (!response.ok) {
                throw new Error(
                    result?.message ??
                        'Gagal menyimpan data import ke database.',
                );
            }

            setImportedTickets(null);
            setLoading(true);
            await fetchTickets();

            toast({
                title: 'Data tersimpan permanen',
                description: `${result.deleted_count ?? 0} data lama diganti ${result.created_count ?? 0} data import untuk periode ini.`,
            });
        } catch (error) {
            toast({
                title: 'Gagal keep data',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Terjadi kesalahan saat menyimpan data import.',
                variant: 'destructive',
            });
        } finally {
            setIsApplyingImport(false);
        }
    };

    const handleRefreshDeleteImportedData = async () => {
        setImportedTickets(null);
        setLoading(true);
        await fetchTickets();
        toast({
            title: 'Data import dihapus',
            description: 'Data halaman direfresh kembali ke data sistem.',
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
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xls,.csv"
                                className="hidden"
                                onChange={handleImportFile}
                            />

                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={handleImportZoneKeyDown}
                                onDragEnter={handleImportDragEnter}
                                onDragOver={handleImportDragOver}
                                onDragLeave={handleImportDragLeave}
                                onDrop={handleImportDrop}
                                className={`w-full rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                                    isDragOverImportZone
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border bg-muted/20'
                                } ${isImporting ? 'pointer-events-none opacity-70' : ''}`}
                                aria-label="Area drag dan drop file import"
                            >
                                <p className="text-sm font-medium">
                                    Tarik dan lepas file .xls atau .csv di sini
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Atau klik area ini untuk memilih file
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadMasterTemplate}
                            >
                                Unduh Master Kosong
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                            >
                                {isImporting ? 'Mengimport...' : 'Import Data'}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadExcel}
                            >
                                Export Data
                            </Button>

                            <select
                                value={reportMonth}
                                onChange={(event) =>
                                    setReportMonth(event.target.value)
                                }
                                className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm text-black ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-800 dark:text-white"
                                aria-label="Filter bulan laporan"
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
                                aria-label="Filter tahun laporan"
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
                                aria-label="Urutkan tanggal laporan"
                            >
                                {DATE_SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            {importedTickets ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => void handleKeepImportedData()}
                                        disabled={isApplyingImport || isImporting}
                                    >
                                        {isApplyingImport
                                            ? 'Menyimpan...'
                                            : 'Keep The Data'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            void handleRefreshDeleteImportedData()
                                        }
                                        disabled={isApplyingImport || isImporting}
                                    >
                                        Refresh to Delete Data
                                    </Button>
                                </>
                            ) : null}

                            <div className="ml-auto text-sm text-muted-foreground">
                                Sumber: {reportSourceLabel} | Filter:{' '}
                                {filterDescription} | Urutan: {reportSortLabel}
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="mb-3 text-sm font-medium">
                                Diagram Batang Laporan
                            </p>
                            <div className="h-[320px] w-full">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memuat data laporan...
                                    </div>
                                ) : reportChartData.some((item) => item.total > 0) ? (
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
                                        Tidak ada data laporan.
                                    </div>
                                )}
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
                                        <TableHead>Pelapor</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Prioritas</TableHead>
                                        <TableHead>Kesulitan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal Laporan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportTickets.length > 0 ? (
                                        reportTickets.map((ticket, index) => (
                                            <TableRow key={`${ticket.id}-${index}`}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{ticket.id}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {ticket.ticket_number || '-'}
                                                </TableCell>
                                                <TableCell>{ticket.title || '-'}</TableCell>
                                                <TableCell>
                                                    {ticket.user?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.user?.email || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {getPriorityLabel(ticket.priority)}
                                                </TableCell>
                                                <TableCell>
                                                    {getDifficultyLabel(
                                                        ticket.difficulty_level,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getTicketStatusLabel(
                                                        ticket.status,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDateTimeForDisplay(
                                                        ticket.created_at,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={10}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                Tidak ada data laporan untuk
                                                ditampilkan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Total laporan: {reportTickets.length}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
