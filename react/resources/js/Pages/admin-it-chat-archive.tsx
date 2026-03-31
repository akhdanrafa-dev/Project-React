import { Head, usePage } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-trigger';
import { useToast } from '@/components/ui/use-toast';
import AdminITLayout from '@/layouts/app/AdminITLayout';
import {
    formatTicketCompletedAt,
    formatTicketLocalDateTime,
} from '@/lib/ticket-timing';
import type { SharedData } from '@/types';

const ARCHIVED_STATUSES = ['closed'];

interface ChatMessage {
    id: number;
    user_id: number;
    message: string;
    image_url?: string | null;
    image_original_name?: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface Ticket {
    id: number;
    ticket_number: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at?: string | null;
    resolved_at?: string | null;
    assigned_to?: number | null;
    collaboration_type?: string;
    collaborators?: number[] | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
    messages: ChatMessage[];
}

export default function AdminITChatArchive() {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth?.user?.id ?? 0;
    const { toast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
        null,
    );
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deletingTicketId, setDeletingTicketId] = useState<number | null>(
        null,
    );
    const [deletingAllArchives, setDeletingAllArchives] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchArchivedTickets();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedTicket?.messages]);

    const fetchArchivedTickets = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/bug-tickets', {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });
            if (!response.ok) throw new Error('Gagal mengambil tiket');

            const data: Ticket[] = await response.json();
            const archived = data.filter((ticket) =>
                ARCHIVED_STATUSES.includes(ticket.status),
            );
            setTickets(archived);
            const hasSelected = selectedTicketId !== null;
            const selectedStillExists =
                hasSelected &&
                archived.some((ticket) => ticket.id === selectedTicketId);

            if (archived.length === 0) {
                setSelectedTicketId(null);
                setSelectedTicket(null);
            } else if (!selectedStillExists) {
                selectTicket(archived[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const selectTicket = (ticketId: number) => {
        setSelectedTicketId(ticketId);
        fetchTicketDetails(ticketId);
    };

    const fetchTicketDetails = async (ticketId: number) => {
        setLoadingDetails(true);
        try {
            const response = await fetch(`/api/bug-tickets/${ticketId}`, {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });
            if (!response.ok) throw new Error('Gagal mengambil detail tiket');
            const data = await response.json();
            setSelectedTicket(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDeleteArchivedTicket = async (ticketId: number) => {
        if (
            !confirm(
                'Apakah Anda yakin ingin menghapus arsip tiket ini? Tindakan ini tidak dapat dibatalkan.',
            )
        ) {
            return;
        }

        setDeletingTicketId(ticketId);
        try {
            const csrfToken = document
                .querySelector("meta[name='csrf-token']")
                ?.getAttribute('content');
            const response = await fetch(`/api/bug-tickets/${ticketId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': csrfToken || '',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                const error = await response
                    .json()
                    .catch(() => ({ message: 'Gagal menghapus tiket' }));
                throw new Error(error.message || 'Gagal menghapus tiket');
            }

            toast({
                title: 'Sukses',
                description: 'Arsip tiket berhasil dihapus',
            });

            if (selectedTicketId === ticketId) {
                setSelectedTicketId(null);
                setSelectedTicket(null);
            }

            await fetchArchivedTickets();
        } catch (err) {
            toast({
                title: 'Error',
                description:
                    err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            });
        } finally {
            setDeletingTicketId(null);
        }
    };

    const handleDeleteAllArchives = async () => {
        if (tickets.length === 0) {
            toast({
                title: 'Informasi',
                description: 'Tidak ada arsip yang bisa dihapus',
            });
            return;
        }

        if (
            !confirm(
                `Apakah Anda yakin ingin menghapus ${tickets.length} arsip tiket? Tindakan ini tidak dapat dibatalkan.`,
            )
        ) {
            return;
        }

        setDeletingAllArchives(true);
        try {
            const csrfToken = document
                .querySelector("meta[name='csrf-token']")
                ?.getAttribute('content');

            for (const ticket of tickets) {
                const response = await fetch(`/api/bug-tickets/${ticket.id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-Token': csrfToken || '',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    throw new Error(`Gagal menghapus tiket ${ticket.id}`);
                }
            }

            toast({
                title: 'Sukses',
                description: 'Semua arsip tiket berhasil dihapus',
            });

            setSelectedTicketId(null);
            setSelectedTicket(null);
            await fetchArchivedTickets();
        } catch (err) {
            toast({
                title: 'Error',
                description:
                    err instanceof Error ? err.message : 'Terjadi kesalahan',
                variant: 'destructive',
            });
        } finally {
            setDeletingAllArchives(false);
        }
    };

    const isCurrentAdminCollaborator = (
        ticket: Pick<
            Ticket,
            'assigned_to' | 'collaboration_type' | 'collaborators'
        >,
    ) => {
        if (!currentUserId) return false;
        if (ticket.assigned_to === currentUserId) return false;
        if (ticket.collaboration_type !== 'collab') return false;
        if (!Array.isArray(ticket.collaborators)) return false;

        return ticket.collaborators.map(Number).includes(Number(currentUserId));
    };

    const renderTicketItem = (ticket: Ticket) => {
        return (
            <div
                key={ticket.id}
                className="cursor-pointer rounded-lg border p-3 transition hover:bg-muted/50"
                onClick={() => selectTicket(ticket.id)}
            >
                <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                        {ticket.ticket_number || '#'} - {ticket.title}
                    </p>
                    <div className="flex items-center gap-2">
                        <Badge
                            className={
                                ticket.status === 'closed'
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                            }
                        >
                            {ticket.status === 'resolved'
                                ? 'Menunggu Verifikasi'
                                : 'Ditutup'}
                        </Badge>
                        {isCurrentAdminCollaborator(ticket) && (
                            <Badge
                                variant="outline"
                                className="border-cyan-300/70 bg-cyan-500/15 text-cyan-700 dark:border-cyan-400/50 dark:bg-cyan-500/20 dark:text-cyan-200"
                            >
                                Collab
                            </Badge>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteArchivedTicket(ticket.id);
                            }}
                            disabled={deletingTicketId === ticket.id}
                            className="text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                        >
                            <Trash2 className="h-4 w-4" />
                            {deletingTicketId === ticket.id ? '...' : 'Hapus'}
                        </Button>
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge
                        className={
                            ticket.priority === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                                : ticket.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                        }
                    >
                        Prioritas: {ticket.priority}
                    </Badge>
                    <p>{ticket.user.name}</p>
                    <p>Masuk: {formatTicketLocalDateTime(ticket.created_at)}</p>
                    <p>Selesai: {formatTicketCompletedAt(ticket)}</p>
                </div>
            </div>
        );
    };

    return (
        <AdminITLayout>
            <Head title="Arsip Chat" />

            <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin-it/chat-archives">
                                Arsip Chat
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <ArrowLeft className="h-5 w-5 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Arsip Chat Tiket
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Lihat percakapan tiket yang sudah ditutup
                        </p>
                    </div>
                </div>

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <p className="text-sm text-red-800">{error}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 lg:grid-cols-[320px,auto]">
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base">
                                        Tiket Ditutup
                                    </CardTitle>
                                    <CardDescription>
                                        Daftar chat yang sudah diarsipkan
                                    </CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleDeleteAllArchives}
                                    disabled={
                                        deletingAllArchives ||
                                        loading ||
                                        tickets.length === 0
                                    }
                                    className="gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {deletingAllArchives
                                        ? 'Menghapus...'
                                        : 'Hapus Semua'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <p className="text-sm text-muted-foreground">
                                    Memuat arsip...
                                </p>
                            ) : tickets.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada arsip
                                </p>
                            ) : (
                                tickets.map(renderTicketItem)
                            )}
                        </CardContent>
                    </Card>

                    <Card className="flex h-full flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base">
                                        {selectedTicket
                                            ? selectedTicket.title
                                            : 'Pilih tiket arsip untuk melihat chat'}
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground">
                                        {selectedTicket
                                            ? `${selectedTicket.ticket_number} -`
                                            : 'Tidak ada tiket terpilih'}
                                    </CardDescription>
                                    {selectedTicket && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className={
                                                        selectedTicket.status ===
                                                        'closed'
                                                            ? 'bg-muted text-muted-foreground'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                                                    }
                                                >
                                                    {selectedTicket.status ===
                                                    'resolved'
                                                        ? 'Menunggu Verifikasi'
                                                        : 'Ditutup'}
                                                </Badge>
                                                {isCurrentAdminCollaborator(
                                                    selectedTicket,
                                                ) && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-cyan-300/70 bg-cyan-500/15 text-cyan-700 dark:border-cyan-400/50 dark:bg-cyan-500/20 dark:text-cyan-200"
                                                    >
                                                        Collab
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                <p>
                                                    Waktu masuk:{' '}
                                                    {formatTicketLocalDateTime(
                                                        selectedTicket.created_at,
                                                    )}
                                                </p>
                                                <p>
                                                    Waktu selesai:{' '}
                                                    {formatTicketCompletedAt(
                                                        selectedTicket,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.history.back()}
                                >
                                    Kembali
                                </Button>
                            </div>
                        </CardHeader>

                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="flex-1 space-y-4 overflow-y-auto bg-muted/30 p-4">
                                {loadingDetails ? (
                                    <p className="text-sm text-muted-foreground">
                                        Memuat chat...
                                    </p>
                                ) : !selectedTicket ? (
                                    <p className="text-center text-sm text-muted-foreground">
                                        Pilih arsip untuk membuka chat
                                    </p>
                                ) : selectedTicket.messages.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground">
                                        Tidak ada pesan di arsip ini.
                                    </p>
                                ) : (
                                    selectedTicket.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className="flex gap-3"
                                        >
                                            <div className="max-w-xs rounded-lg border border-border bg-card px-4 py-2 text-card-foreground">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {msg.user.name}
                                                </p>
                                                {msg.message ? (
                                                    <p className="text-sm">
                                                        {msg.message}
                                                    </p>
                                                ) : null}
                                                {msg.image_url ? (
                                                    <a
                                                        href={msg.image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 block rounded-md border border-border bg-card"
                                                    >
                                                        <img
                                                            src={msg.image_url}
                                                            alt={
                                                                msg.image_original_name ||
                                                                'Lampiran chat'
                                                            }
                                                            className="max-h-64 w-full rounded-md object-contain"
                                                            loading="lazy"
                                                        />
                                                    </a>
                                                ) : null}
                                                {msg.image_original_name ? (
                                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                                        {
                                                            msg.image_original_name
                                                        }
                                                    </p>
                                                ) : null}
                                                <p className="text-[10px] text-muted-foreground">
                                                    {new Date(
                                                        msg.created_at,
                                                    ).toLocaleTimeString(
                                                        'id-ID',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="border-t p-4">
                                <p className="text-xs text-muted-foreground">
                                    Percakapan ini sudah diarsipkan - tidak bisa
                                    membalas lagi.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AdminITLayout>
    );
}
