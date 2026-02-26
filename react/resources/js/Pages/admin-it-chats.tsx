import { Head, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ImagePlus,
    MessageSquare,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-trigger';
import AdminITLayout from '@/layouts/app/AdminITLayout';
import type { SharedData } from '@/types';

interface AdminUser {
    id: number;
    name: string;
    email: string;
}

interface ChatMessage {
    id: number;
    user_id: number;
    message: string;
    image_url?: string | null;
    image_original_name?: string | null;
    image_size?: number | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        role: string;
    };
    is_read: boolean;
}

interface Ticket {
    id: number;
    ticket_number: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    difficulty_level?: string;
    category: string;
    collaboration_type?: string;
    collaborators?: number[] | null;
    created_at: string;
    assigned_to?: number | null;
    assignedAdmin?: {
        id: number;
        name: string;
    } | null;
    assigned_admin?: {
        id: number;
        name: string;
    } | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
    messages: ChatMessage[];
}

const getCsrfToken = () => {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || ''
    );
};

const updateCsrfToken = (newToken: string) => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag && newToken) {
        metaTag.setAttribute('content', newToken);
    }
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || '';
    }
    return '';
};

const getXsrfTokenFromCookie = () => {
    const raw = getCookie('XSRF-TOKEN');
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
};

const syncCsrfTokenFromResponse = (response: Response) => {
    const nextToken =
        response.headers.get('X-CSRF-Token') ||
        response.headers.get('x-csrf-token');
    if (nextToken) {
        updateCsrfToken(nextToken);
    }
};

const ensureCsrfCookie = async () => {
    await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        cache: 'no-store',
    });
};

const buildCsrfHeaders = (headers?: HeadersInit) => {
    const merged = new Headers(headers || {});
    const csrfToken = getCsrfToken();
    const xsrfToken = getXsrfTokenFromCookie();

    if (csrfToken) {
        merged.set('X-CSRF-TOKEN', csrfToken);
    }
    if (xsrfToken) {
        merged.set('X-XSRF-TOKEN', xsrfToken);
    }
    if (!merged.has('X-Requested-With')) {
        merged.set('X-Requested-With', 'XMLHttpRequest');
    }

    return merged;
};

const fetchWithCsrfRetry = async (
    url: string,
    init: RequestInit = {},
    allowRetry = true,
): Promise<Response> => {
    const requestInit: RequestInit = {
        ...init,
        credentials: init.credentials || 'same-origin',
        headers: buildCsrfHeaders(init.headers),
    };

    let response = await fetch(url, requestInit);
    syncCsrfTokenFromResponse(response);

    if (response.status === 419 && allowRetry) {
        try {
            await ensureCsrfCookie();
        } catch {
            // Continue retry path with available token sources.
        }
        response = await fetch(url, {
            ...init,
            credentials: init.credentials || 'same-origin',
            headers: buildCsrfHeaders(init.headers),
        });
        syncCsrfTokenFromResponse(response);
    }

    return response;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const isChatTicketVisible = (ticket: Pick<Ticket, 'status'>) =>
    ticket.status !== 'closed';
const normalizeTicket = (ticket: Ticket): Ticket => ({
    ...ticket,
    assignedAdmin: ticket.assignedAdmin ?? ticket.assigned_admin ?? null,
});

export default function AdminITChats() {
    const { auth } = usePage<SharedData>().props;
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
        null,
    );
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<
        string | null
    >(null);
    const [adminList, setAdminList] = useState<AdminUser[]>([]);
    const [selectedCollaborator, setSelectedCollaborator] = useState<
        number | null
    >(null);
    const [collaboratorsDetails, setCollaboratorsDetails] = useState<
        AdminUser[]
    >([]);
    const [isInvitingCollaborator, setIsInvitingCollaborator] = useState(false);
    const [showCollaborationModal, setShowCollaborationModal] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const autoScrollRef = useRef(true);
    const lastTicketIdRef = useRef<number | null>(null);
    const lastMessageCountRef = useRef(0);
    const currentUserId = auth.user?.id || 0;

    useEffect(() => {
        fetchTickets();

        // Fetch admin list saat component mount (pastikan currentUserId 100% defined)
        if (currentUserId) {
            fetchAdminList();
        }

        // Smart polling: fetch hanya messages baru setiap 3 detik (tanpa reset chat)
        const messageInterval = setInterval(() => {
            if (selectedTicketId) {
                fetchOnlyNewMessages(selectedTicketId);
            }
        }, 3000);

        // Full update tiket list setiap 30 detik
        const listInterval = setInterval(() => {
            fetchTickets(true);
        }, 30000);

        return () => {
            clearInterval(messageInterval);
            clearInterval(listInterval);
        };
    }, [currentUserId, selectedTicketId]);

    useEffect(() => {
        const refreshOnFocus = () => {
            fetchTickets(true);
            if (selectedTicketId) {
                fetchTicketDetails(selectedTicketId);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshOnFocus();
            }
        };

        window.addEventListener('focus', refreshOnFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', refreshOnFocus);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, [selectedTicketId]);

    useEffect(() => {
        const currentTicketId = selectedTicket?.id ?? null;
        const currentMessageCount = selectedTicket?.messages?.length ?? 0;
        const ticketChanged = lastTicketIdRef.current !== currentTicketId;
        const hasNewMessages =
            currentMessageCount > lastMessageCountRef.current;

        if (ticketChanged) {
            requestAnimationFrame(() => {
                scrollToBottom('auto');
            });
            autoScrollRef.current = true;
        } else if (hasNewMessages && autoScrollRef.current) {
            requestAnimationFrame(() => {
                scrollToBottom('smooth');
            });
        }

        lastTicketIdRef.current = currentTicketId;
        lastMessageCountRef.current = currentMessageCount;
    }, [selectedTicket?.id, selectedTicket?.messages?.length]);

    useEffect(() => {
        return () => {
            if (selectedImagePreviewUrl) {
                URL.revokeObjectURL(selectedImagePreviewUrl);
            }
        };
    }, [selectedImagePreviewUrl]);

    useEffect(() => {
        setMessage('');
        setSelectedImage(null);
        setSelectedImagePreviewUrl((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev);
            }
            return null;
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // Load collaborators details saat ticket berubah
        if (selectedTicketId) {
            fetchCollaboratorsDetails(selectedTicketId);
        }
    }, [selectedTicketId]);

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
        const container = messagesContainerRef.current;
        if (!container) return;

        container.scrollTo({
            top: container.scrollHeight,
            behavior,
        });
    };

    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const distanceFromBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;

        autoScrollRef.current = distanceFromBottom < 80;
    };

    const fetchTickets = async (isPolling = false) => {
        if (!isPolling) {
            setLoadingTickets(true);
        }
        setError(null);
        try {
            const response = await fetch('/api/bug-tickets', {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                cache: 'no-store',
            });
            syncCsrfTokenFromResponse(response);
            if (!response.ok) throw new Error('Gagal mengambil tiket');

            const data: Ticket[] = await response.json();
            const normalizedTickets = data.map(normalizeTicket);
            const activeTickets = normalizedTickets.filter(isChatTicketVisible);
            setTickets(activeTickets);

            const hasSelected = selectedTicketId !== null;
            const selectedStillExists =
                hasSelected &&
                activeTickets.some((ticket) => ticket.id === selectedTicketId);

            if (activeTickets.length === 0) {
                setSelectedTicketId(null);
                setSelectedTicket(null);
            } else if (!selectedStillExists) {
                selectTicket(activeTickets[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            if (!isPolling) {
                setLoadingTickets(false);
            }
        }
    };

    const selectTicket = (ticketId: number) => {
        setSelectedTicketId(ticketId);
        fetchTicketDetails(ticketId);
    };

    const fetchTicketDetails = async (ticketId: number) => {
        setLoadingTicketDetails(true);
        try {
            const response = await fetch(`/api/bug-tickets/${ticketId}`, {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                cache: 'no-store',
            });
            syncCsrfTokenFromResponse(response);
            if (!response.ok) throw new Error('Gagal mengambil detail tiket');
            const data: Ticket = normalizeTicket(await response.json());

            if (!isChatTicketVisible(data)) {
                setSelectedTicketId(null);
                setSelectedTicket(null);
                await fetchTickets(true);
                return;
            }

            setSelectedTicket(data);
            await fetchWithCsrfRetry(
                `/api/bug-tickets/${ticketId}/messages/mark-all-as-read`,
                {
                    method: 'PATCH',
                },
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoadingTicketDetails(false);
        }
    };

    const fetchAdminList = async () => {
        try {
            const response = await fetch('/api/admin-it-list', {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                cache: 'no-store',
            });
            syncCsrfTokenFromResponse(response);
            if (!response.ok) {
                console.error('Failed to fetch admin list:', response.status);
                return;
            }
            const data: AdminUser[] = await response.json();
            console.log('Admin list fetched:', data);
            const filtered = data.filter((admin) => admin.id !== currentUserId);
            console.log('Filtered admin list (excluding self):', filtered);
            setAdminList(filtered);
        } catch (err) {
            console.error('Failed to fetch admin list:', err);
        }
    };

    const fetchCollaboratorsDetails = async (ticketId: number) => {
        try {
            const response = await fetch(
                `/api/bug-tickets/${ticketId}/collaborators`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    cache: 'no-store',
                },
            );
            syncCsrfTokenFromResponse(response);
            if (response.ok) {
                const data = await response.json();
                setCollaboratorsDetails(data.collaborators || []);
            }
        } catch (err) {
            console.error('Failed to fetch collaborators:', err);
        }
    };

    const fetchOnlyNewMessages = async (ticketId: number) => {
        try {
            const response = await fetch(
                `/api/bug-tickets/${ticketId}/messages`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    cache: 'no-store',
                },
            );
            syncCsrfTokenFromResponse(response);
            if (!response.ok) throw new Error('Gagal mengambil pesan');
            const newMessages: ChatMessage[] = await response.json();

            // Merge dengan messages yang ada, hindari duplikat
            setSelectedTicket((prevTicket) => {
                if (!prevTicket) return prevTicket;

                const existingIds = new Set(
                    prevTicket.messages.map((m) => m.id),
                );
                const messagesToAdd = newMessages.filter(
                    (m) => !existingIds.has(m.id),
                );

                // Hanya update jika ada messages baru
                if (messagesToAdd.length > 0) {
                    return {
                        ...prevTicket,
                        messages: [...prevTicket.messages, ...messagesToAdd],
                    };
                }

                return prevTicket;
            });
        } catch (err) {
            console.error('Failed to fetch new messages:', err);
        }
    };

    const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedMessage = message.trim();
        if ((!trimmedMessage && !selectedImage) || !selectedTicketId || sending)
            return;

        setSending(true);
        try {
            const formData = new FormData();
            if (trimmedMessage) {
                formData.append('message', trimmedMessage);
            }
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const response = await fetchWithCsrfRetry(
                `/api/bug-tickets/${selectedTicketId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                    },
                    body: formData,
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const validationMessage = errorData?.errors
                    ? (Object.values(errorData.errors).flat()[0] as
                          | string
                          | undefined)
                    : undefined;

                throw new Error(
                    validationMessage ||
                        errorData?.message ||
                        'Gagal mengirim pesan',
                );
            }
            setMessage('');
            setSelectedImage(null);
            if (selectedImagePreviewUrl) {
                URL.revokeObjectURL(selectedImagePreviewUrl);
            }
            setSelectedImagePreviewUrl(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            await fetchTicketDetails(selectedTicketId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setSending(false);
        }
    };

    const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('File harus berupa gambar.');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            setError('Ukuran gambar maksimal 5MB.');
            event.target.value = '';
            return;
        }

        if (selectedImagePreviewUrl) {
            URL.revokeObjectURL(selectedImagePreviewUrl);
        }

        setError(null);
        setSelectedImage(file);
        setSelectedImagePreviewUrl(URL.createObjectURL(file));
    };

    const clearSelectedImage = () => {
        setSelectedImage(null);
        if (selectedImagePreviewUrl) {
            URL.revokeObjectURL(selectedImagePreviewUrl);
        }
        setSelectedImagePreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const refreshTicketViews = async (
        ticketId: number,
        includeCollaborators = false,
    ) => {
        await fetchTicketDetails(ticketId);
        await fetchTickets(true);
        if (includeCollaborators) {
            await fetchCollaboratorsDetails(ticketId);
        }
    };

    const handleTakeTicket = async () => {
        if (!selectedTicket || !currentUserId) return;

        try {
            const ticketId = selectedTicket.id;
            const response = await fetchWithCsrfRetry(
                `/api/bug-tickets/${ticketId}/take`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ assigned_to: currentUserId }),
                },
            );

            if (!response.ok) throw new Error('Gagal mengambil tiket');
            await refreshTicketViews(ticketId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        }
    };

    const handleResolveTicket = async () => {
        if (!selectedTicket || selectedTicket.status !== 'in_progress') return;

        try {
            const ticketId = selectedTicket.id;
            const response = await fetchWithCsrfRetry(
                `/api/bug-tickets/${ticketId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ status: 'resolved' }),
                },
            );

            if (!response.ok) throw new Error('Gagal mengubah status tiket');
            await refreshTicketViews(ticketId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        }
    };

    const handleInviteCollaborator = async () => {
        if (!selectedTicket || !selectedCollaborator) {
            setError('Pilih admin untuk diajak berkolaborasi');
            return;
        }

        // Strict check: hanya pemilik yang bisa invite
        if ((selectedTicket.assigned_to as number) !== currentUserId) {
            setError('❌ Hanya pemilik tiket yang dapat menambah kolaborator');
            return;
        }

        setIsInvitingCollaborator(true);
        try {
            const response = await fetchWithCsrfRetry(
                `/api/bug-tickets/${selectedTicket.id}/collaborators/invite`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        collaborator_id: selectedCollaborator,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'Gagal menambah kolaborator',
                );
            }

            await refreshTicketViews(selectedTicket.id, true);
            setSelectedCollaborator(null);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Gagal menambah kolaborator',
            );
        } finally {
            setIsInvitingCollaborator(false);
        }
    };

    const handleRemoveCollaborator = async (collaboratorId: number) => {
        if (!selectedTicket) return;

        // Strict check: hanya pemilik yang bisa remove
        if ((selectedTicket.assigned_to as number) !== currentUserId) {
            setError('❌ Hanya pemilik tiket yang dapat menghapus kolaborator');
            return;
        }

        try {
            const response = await fetchWithCsrfRetry(
                `/api/bug-tickets/${selectedTicket.id}/collaborators/remove`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ collaborator_id: collaboratorId }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'Gagal menghapus kolaborator',
                );
            }

            await refreshTicketViews(selectedTicket.id, true);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Gagal menghapus kolaborator',
            );
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open':
                return 'Terbuka';
            case 'in_progress':
                return 'Dalam Proses';
            case 'resolved':
                return 'Terselesaikan';
            case 'closed':
                return 'Ditutup';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200';
            case 'in_progress':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200';
            case 'resolved':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200';
            case 'closed':
                return 'bg-muted text-muted-foreground';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const isCurrentAdminCollaborator = (
        ticket: Pick<
            Ticket,
            'status' | 'assigned_to' | 'collaboration_type' | 'collaborators'
        >,
    ) => {
        if (!currentUserId) return false;
        if (ticket.assigned_to === currentUserId) return false;
        if (ticket.collaboration_type !== 'collab') return false;
        if (!Array.isArray(ticket.collaborators)) return false;

        return ticket.collaborators.map(Number).includes(Number(currentUserId));
    };

    const selectedTicketUserImages = (selectedTicket?.messages ?? []).filter(
        (msg) => msg.user?.role === 'user' && !!msg.image_url,
    );
    const canResolveSelectedTicket =
        selectedTicket?.status === 'in_progress' &&
        (selectedTicket.assigned_to === currentUserId ||
            isCurrentAdminCollaborator(selectedTicket));
    const isSelectedTicketChatLocked = selectedTicket
        ? ['resolved', 'closed'].includes(selectedTicket.status)
        : true;

    return (
        <AdminITLayout>
            <Head title="Chat Tiket" />

            <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin-it/chats">
                                Chat Tiket
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Chat Tiket
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Komunikasikan progress tiket yang sedang Anda
                            tangani
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
                            <CardTitle className="text-base">
                                Tiket Saya
                            </CardTitle>
                            <CardDescription>
                                Daftar tiket yang bisa Anda chat-kan langsung
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loadingTickets ? (
                                <p className="text-sm text-muted-foreground">
                                    Memuat tiket...
                                </p>
                            ) : tickets.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada tiket
                                </p>
                            ) : (
                                tickets.map((ticket) => {
                                    const unread = (
                                        ticket.messages ?? []
                                    ).filter(
                                        (msg) =>
                                            !msg.is_read &&
                                            msg.user_id !== currentUserId,
                                    ).length;
                                    const isSelected =
                                        ticket.id === selectedTicketId;

                                    return (
                                        <div
                                            key={ticket.id}
                                            className={`cursor-pointer rounded-lg border p-3 transition ${
                                                isSelected
                                                    ? 'border-primary/60 bg-primary/10'
                                                    : 'border-border hover:border-primary/50 hover:bg-muted/40'
                                            }`}
                                            onClick={() =>
                                                selectTicket(ticket.id)
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-semibold">
                                                    {ticket.ticket_number ||
                                                        `#${ticket.id}`}{' '}
                                                    - {ticket.title}
                                                </p>
                                                {unread > 0 && (
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                                        {unread}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                <Badge
                                                    className={getStatusColor(
                                                        ticket.status,
                                                    )}
                                                >
                                                    {getStatusLabel(
                                                        ticket.status,
                                                    )}
                                                </Badge>
                                                {isCurrentAdminCollaborator(
                                                    ticket,
                                                ) && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-cyan-300/70 bg-cyan-500/15 text-cyan-700 dark:border-cyan-400/50 dark:bg-cyan-500/20 dark:text-cyan-200"
                                                    >
                                                        Collab
                                                    </Badge>
                                                )}
                                                <Badge
                                                    className={getPriorityColor(
                                                        ticket.priority,
                                                    )}
                                                >
                                                    Prioritas: {ticket.priority}
                                                </Badge>
                                                <p>{ticket.user.name}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    <Card className="flex h-full flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <CardTitle className="text-base">
                                        {selectedTicket
                                            ? selectedTicket.title
                                            : 'Pilih tiket untuk mulai chat'}
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                                        {selectedTicket?.ticket_number} •{' '}
                                        {selectedTicket?.user.name}
                                        {selectedTicket && (
                                            <div className="mt-2 text-xs">
                                                {selectedTicket.assignedAdmin ? (
                                                    <span className="text-green-600">
                                                        Handle By:{' '}
                                                        {
                                                            selectedTicket
                                                                .assignedAdmin
                                                                .name
                                                        }
                                                    </span>
                                                ) : selectedTicket.status ===
                                                  'open' ? (
                                                    <span className="text-orange-600">
                                                        Belum di-handle
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        Riwayat pengambilan
                                                        tiket hanya dapat
                                                        dilihat oleh pemilik
                                                        akun.
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.history.back()}
                                    className="hidden sm:inline-flex"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali
                                </Button>
                            </div>
                        </CardHeader>

                        <div className="flex min-h-0 flex-1 flex-col">
                            <div
                                ref={messagesContainerRef}
                                onScroll={handleMessagesScroll}
                                className="flex-1 space-y-4 overflow-y-auto bg-muted/30 p-4"
                            >
                                {loadingTicketDetails ? (
                                    <p className="text-sm text-muted-foreground">
                                        Memuat chat...
                                    </p>
                                ) : !selectedTicket ? (
                                    <p className="text-center text-sm text-muted-foreground">
                                        Pilih tiket untuk melihat chat.
                                    </p>
                                ) : selectedTicket.messages.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground">
                                        Belum ada pesan. Mulai percakapan dengan
                                        pengguna.
                                    </p>
                                ) : (
                                    selectedTicket.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 ${
                                                msg.user_id === currentUserId
                                                    ? 'justify-end'
                                                    : 'justify-start'
                                            }`}
                                        >
                                            {msg.user_id !== currentUserId && (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                                    {msg.user.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                            <div className="max-w-[75%] space-y-1">
                                                <p className="text-xs text-muted-foreground">
                                                    {msg.user.name}
                                                </p>
                                                <div
                                                    className={`rounded-lg px-3 py-2 ${
                                                        msg.user_id ===
                                                        currentUserId
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'border border-border bg-card text-card-foreground'
                                                    }`}
                                                >
                                                    {msg.message ? (
                                                        <p>{msg.message}</p>
                                                    ) : null}
                                                    {msg.image_url ? (
                                                        <a
                                                            href={msg.image_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`mt-2 block rounded-md border ${
                                                                msg.user_id ===
                                                                currentUserId
                                                                    ? 'border-primary-foreground/50'
                                                                    : 'border-border'
                                                            }`}
                                                        >
                                                            <img
                                                                src={
                                                                    msg.image_url
                                                                }
                                                                alt={
                                                                    msg.image_original_name ||
                                                                    'Lampiran chat'
                                                                }
                                                                className="max-h-64 w-full rounded-md bg-black/5 object-contain"
                                                                loading="lazy"
                                                            />
                                                        </a>
                                                    ) : null}
                                                    {msg.image_original_name ? (
                                                        <p
                                                            className={`mt-1 text-[11px] ${
                                                                msg.user_id ===
                                                                currentUserId
                                                                    ? 'text-blue-100'
                                                                    : 'text-muted-foreground'
                                                            }`}
                                                        >
                                                            {
                                                                msg.image_original_name
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
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
                            </div>

                            <form
                                onSubmit={handleSendMessage}
                                className="space-y-3 border-t p-4"
                            >
                                {selectedTicket ? (
                                    <div className="rounded-md border bg-muted/20 p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-xs font-medium">
                                                Galeri Bukti User
                                            </p>
                                            <span className="text-[11px] text-muted-foreground">
                                                {
                                                    selectedTicketUserImages.length
                                                }{' '}
                                                gambar
                                            </span>
                                        </div>
                                        {selectedTicketUserImages.length ===
                                        0 ? (
                                            <p className="text-[11px] text-muted-foreground">
                                                Belum ada screenshot dari user
                                                pada tiket ini.
                                            </p>
                                        ) : (
                                            <div className="flex gap-2 overflow-x-auto pb-1">
                                                {selectedTicketUserImages.map(
                                                    (msg) => (
                                                        <a
                                                            key={msg.id}
                                                            href={
                                                                msg.image_url ??
                                                                '#'
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block shrink-0 overflow-hidden rounded-md border bg-card"
                                                            title={
                                                                msg.image_original_name ||
                                                                `Bukti #${msg.id}`
                                                            }
                                                        >
                                                            <img
                                                                src={
                                                                    msg.image_url ??
                                                                    ''
                                                                }
                                                                alt={
                                                                    msg.image_original_name ||
                                                                    `Bukti #${msg.id}`
                                                                }
                                                                className="h-20 w-20 object-cover"
                                                                loading="lazy"
                                                            />
                                                        </a>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs text-muted-foreground">
                                        {selectedTicket
                                            ? `Status: ${getStatusLabel(selectedTicket.status)}${isCurrentAdminCollaborator(selectedTicket) ? ' (Collab)' : ''}`
                                            : 'Pilih tiket untuk mengirim pesan'}
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedTicket?.status === 'open' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                type="button"
                                                onClick={handleTakeTicket}
                                            >
                                                Ambil Tiket
                                            </Button>
                                        )}
                                        {selectedTicket?.status ===
                                            'in_progress' &&
                                            selectedTicket.assigned_to ===
                                                currentUserId && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        type="button"
                                                        onClick={() =>
                                                            setShowCollaborationModal(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Kolaborasi
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        type="button"
                                                        onClick={
                                                            handleResolveTicket
                                                        }
                                                    >
                                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                                        Tandai Terselesaikan
                                                    </Button>
                                                </>
                                            )}
                                        {selectedTicket?.status ===
                                            'in_progress' &&
                                            selectedTicket.assigned_to !==
                                                currentUserId && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    type="button"
                                                    onClick={
                                                        handleResolveTicket
                                                    }
                                                    disabled={
                                                        !canResolveSelectedTicket
                                                    }
                                                    title={
                                                        canResolveSelectedTicket
                                                            ? undefined
                                                            : 'Hanya kolaborator pada tiket ini yang dapat menyelesaikan'
                                                    }
                                                >
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    Tandai Terselesaikan
                                                </Button>
                                            )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Tulis pesan atau lampirkan screenshot..."
                                            value={message}
                                            onChange={(e) =>
                                                setMessage(e.target.value)
                                            }
                                            disabled={
                                                !selectedTicket ||
                                                isSelectedTicketChatLocked
                                            }
                                        />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleSelectImage}
                                            disabled={
                                                !selectedTicket ||
                                                isSelectedTicketChatLocked
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={
                                                !selectedTicket ||
                                                isSelectedTicketChatLocked
                                            }
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                !selectedTicket ||
                                                isSelectedTicketChatLocked ||
                                                sending ||
                                                (!message.trim() &&
                                                    !selectedImage)
                                            }
                                        >
                                            Kirim
                                        </Button>
                                    </div>
                                    {selectedImage ? (
                                        <div className="rounded-md border bg-muted/20 p-2">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-xs font-medium">
                                                    {selectedImage.name} (
                                                    {formatFileSize(
                                                        selectedImage.size,
                                                    )}
                                                    )
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={clearSelectedImage}
                                                    title="Hapus gambar"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            {selectedImagePreviewUrl ? (
                                                <img
                                                    src={
                                                        selectedImagePreviewUrl
                                                    }
                                                    alt="Preview gambar"
                                                    className="max-h-36 rounded-md object-contain"
                                                />
                                            ) : null}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">
                                            {isSelectedTicketChatLocked
                                                ? 'Chat terkunci karena tiket sudah terselesaikan/ditutup.'
                                                : 'Batas ukuran gambar: 5MB.'}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>

                {/* Collaboration Modal */}
                {showCollaborationModal &&
                    selectedTicket &&
                    selectedTicket.assigned_to === currentUserId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <Card className="w-full max-w-md">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Kelola Kolaborasi
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setShowCollaborationModal(false)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardDescription>
                                        Tiket: {selectedTicket.ticket_number}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {error && (
                                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                                            {error}
                                        </div>
                                    )}

                                    {/* Current Collaborators */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">
                                            Kolaborator Saat Ini
                                        </p>
                                        {collaboratorsDetails.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">
                                                Belum ada kolaborator
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {collaboratorsDetails.map(
                                                    (collaborator) => (
                                                        <div
                                                            key={
                                                                collaborator.id
                                                            }
                                                            className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 p-2"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">
                                                                    {
                                                                        collaborator.name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {
                                                                        collaborator.email
                                                                    }
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveCollaborator(
                                                                        collaborator.id,
                                                                    )
                                                                }
                                                                title="Hapus kolaborator"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add Collaborator */}
                                    <div className="space-y-2 border-t pt-4">
                                        <p className="text-sm font-medium">
                                            Tambah Kolaborator
                                        </p>
                                        {adminList.length === 0 ? (
                                            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
                                                Tidak ada admin IT lain yang
                                                tersedia
                                            </div>
                                        ) : (
                                            <>
                                                <select
                                                    value={
                                                        selectedCollaborator?.toString() ||
                                                        ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        console.log(
                                                            'Selected value:',
                                                            val,
                                                        );
                                                        setSelectedCollaborator(
                                                            val
                                                                ? Number(val)
                                                                : null,
                                                        );
                                                    }}
                                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                                >
                                                    <option value="">
                                                        -- Pilih admin IT --
                                                    </option>
                                                    {adminList.map((admin) => {
                                                        const isAlreadyCollaborator =
                                                            collaboratorsDetails.some(
                                                                (c) =>
                                                                    c.id ===
                                                                    admin.id,
                                                            );
                                                        return (
                                                            <option
                                                                key={admin.id}
                                                                value={admin.id}
                                                                disabled={
                                                                    isAlreadyCollaborator
                                                                }
                                                            >
                                                                {admin.name}{' '}
                                                                {isAlreadyCollaborator
                                                                    ? '(sudah ada)'
                                                                    : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <Button
                                                    onClick={
                                                        handleInviteCollaborator
                                                    }
                                                    disabled={
                                                        !selectedCollaborator ||
                                                        isInvitingCollaborator
                                                    }
                                                    className="w-full"
                                                >
                                                    {isInvitingCollaborator
                                                        ? 'Menambahkan...'
                                                        : 'Tambah Kolaborator'}
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                                        <p className="font-medium">Catatan:</p>
                                        <ul className="mt-1 list-inside list-disc space-y-1">
                                            <li>
                                                Ticket akan bertipe "collab"
                                                saat ada kolaborator
                                            </li>
                                            <li>
                                                Kolaborator dapat membantu
                                                menyelesaikan tiket
                                            </li>
                                            <li>
                                                Hanya pemilik tiket yang dapat
                                                manage kolaborator
                                            </li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
            </div>
        </AdminITLayout>
    );
}
