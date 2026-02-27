import { Head, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    ImagePlus,
    Send,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminITLayout from '@/layouts/app/AdminITLayout';
import type { SharedData } from '@/types';

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

interface CollaboratorDetail {
    id: number;
    name: string;
    email?: string | null;
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

interface Props {
    ticketId: number;
}

const getCsrfToken = () => {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || ''
    );
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminITChat({ ticketId }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [collaboratorsDetails, setCollaboratorsDetails] = useState<
        CollaboratorDetail[]
    >([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<
        string | null
    >(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentUserId = auth.user?.id || 0;

    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    useEffect(() => {
        scrollToBottom();
    }, [ticket?.messages]);

    useEffect(() => {
        return () => {
            if (selectedImagePreviewUrl) {
                URL.revokeObjectURL(selectedImagePreviewUrl);
            }
        };
    }, [selectedImagePreviewUrl]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchCollaborators = async (currentTicketId: number) => {
        try {
            const response = await fetch(
                `/api/bug-tickets/${currentTicketId}/collaborators`,
            );
            if (!response.ok) throw new Error('Failed to fetch collaborators');

            const data = await response.json();
            const collaborators = Array.isArray(data?.collaborators)
                ? (data.collaborators as CollaboratorDetail[])
                : [];
            setCollaboratorsDetails(collaborators);
        } catch (err) {
            console.error('Failed to fetch collaborators:', err);
            setCollaboratorsDetails([]);
        }
    };

    const fetchTicket = async () => {
        try {
            const response = await fetch(`/api/bug-tickets/${ticketId}`);
            if (!response.ok) throw new Error('Failed to fetch ticket');
            const data = (await response.json()) as Ticket;
            setTicket(data);
            if (data.collaboration_type === 'collab') {
                await fetchCollaborators(data.id);
            } else {
                setCollaboratorsDetails([]);
            }
            await markMessagesAsRead();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async () => {
        try {
            await fetch(
                `/api/bug-tickets/${ticketId}/messages/mark-all-as-read`,
                {
                    method: 'PATCH',
                    headers: {
                        'X-CSRF-Token': getCsrfToken(),
                    },
                },
            );
        } catch (err) {
            console.error('Failed to mark messages as read:', err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedMessage = message.trim();
        if ((!trimmedMessage && !selectedImage) || sending) return;

        setSending(true);
        try {
            const formData = new FormData();
            if (trimmedMessage) {
                formData.append('message', trimmedMessage);
            }
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const response = await fetch(
                `/api/bug-tickets/${ticketId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'X-CSRF-Token': getCsrfToken(),
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
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
                        'Failed to send message',
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
            await fetchTicket();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to send message',
            );
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

    const handleResolveTicket = async () => {
        if (!ticket) return;
        try {
            const response = await fetch(`/api/bug-tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken(),
                },
                body: JSON.stringify({
                    status: 'resolved',
                }),
            });
            if (!response.ok) throw new Error('Failed to resolve ticket');
            await fetchTicket();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to resolve ticket',
            );
        }
    };

    const handleCloseTicket = async () => {
        if (!ticket) return;
        try {
            const response = await fetch(`/api/bug-tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken(),
                },
                body: JSON.stringify({
                    status: 'closed',
                }),
            });
            if (!response.ok) throw new Error('Failed to close ticket');
            await fetchTicket();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to close ticket',
            );
        }
    };

    const handleTakeTicket = async () => {
        if (!ticket || !currentUserId) return;

        try {
            const response = await fetch(`/api/bug-tickets/${ticket.id}/take`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken(),
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ assigned_to: currentUserId }),
            });

            if (!response.ok) throw new Error('Gagal mengambil tiket');
            await fetchTicket();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in_progress':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200';
            case 'resolved':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200';
            case 'closed':
                return 'bg-muted text-muted-foreground';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200';
            case 'hard':
                return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    if (loading) {
        return (
            <AdminITLayout>
                <div className="p-6">
                    <div>Loading...</div>
                </div>
            </AdminITLayout>
        );
    }

    if (!ticket) {
        return (
            <AdminITLayout>
                <div className="p-6">
                    <div>Tiket tidak ditemukan</div>
                </div>
            </AdminITLayout>
        );
    }

    const assignedAdminName =
        ticket.assignedAdmin?.name ??
        ticket.assigned_admin?.name ??
        (ticket.assigned_to === currentUserId
            ? (auth.user?.name ?? null)
            : null);
    const isCollabTicket = ticket.collaboration_type === 'collab';
    const collaboratorNames = collaboratorsDetails
        .map((collaborator) => collaborator.name)
        .filter(Boolean);

    const userImageMessages = ticket.messages.filter(
        (msg) => msg.user?.role === 'user' && !!msg.image_url,
    );

    return (
        <AdminITLayout>
            <div className="space-y-4 p-4 md:p-6">
                <Head title={`Chat - ${ticket.ticket_number}`} />

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                </div>

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <p className="text-sm text-red-800">{error}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Chat Section */}
                    <div className="lg:col-span-2">
                        <Card className="flex h-[600px] flex-col">
                            <CardHeader className="border-b">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{ticket.title}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {ticket.ticket_number} •{' '}
                                            {ticket.user.name}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        className={getStatusColor(
                                            ticket.status,
                                        )}
                                    >
                                        {ticket.status === 'in_progress'
                                            ? 'Dalam Proses'
                                            : ticket.status}
                                    </Badge>
                                </div>
                            </CardHeader>

                            {/* Messages */}
                            <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
                                {ticket.messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Tidak ada pesan
                                    </div>
                                ) : (
                                    <>
                                        {ticket.messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${
                                                    msg.user_id ===
                                                    currentUserId
                                                        ? 'justify-end'
                                                        : 'justify-start'
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-xs rounded-lg px-4 py-2 ${
                                                        msg.user_id ===
                                                        currentUserId
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'border border-border bg-card text-card-foreground'
                                                    }`}
                                                >
                                                    <p className="mb-1 text-sm font-medium">
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
                                                                src={
                                                                    msg.image_url
                                                                }
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
                                                        <p
                                                            className={`mt-1 text-[11px] ${
                                                                msg.user_id ===
                                                                currentUserId
                                                                    ? 'text-primary-foreground/80'
                                                                    : 'text-muted-foreground'
                                                            }`}
                                                        >
                                                            {
                                                                msg.image_original_name
                                                            }
                                                        </p>
                                                    ) : null}
                                                    <p
                                                        className={`mt-1 text-xs ${
                                                            msg.user_id ===
                                                            currentUserId
                                                                ? 'text-primary-foreground/80'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {new Date(
                                                            msg.created_at,
                                                        ).toLocaleTimeString(
                                                            'id-ID',
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </CardContent>

                            {/* Message Input */}
                            <div className="border-t p-4">
                                <form
                                    onSubmit={handleSendMessage}
                                    className="space-y-2"
                                >
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ketik pesan atau lampirkan screenshot..."
                                            value={message}
                                            onChange={(e) =>
                                                setMessage(e.target.value)
                                            }
                                            disabled={
                                                sending ||
                                                ['resolved', 'closed'].includes(
                                                    ticket.status,
                                                )
                                            }
                                        />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleSelectImage}
                                            disabled={
                                                sending ||
                                                ['resolved', 'closed'].includes(
                                                    ticket.status,
                                                )
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={
                                                sending ||
                                                ['resolved', 'closed'].includes(
                                                    ticket.status,
                                                )
                                            }
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                sending ||
                                                (!message.trim() &&
                                                    !selectedImage) ||
                                                ['resolved', 'closed'].includes(
                                                    ticket.status,
                                                )
                                            }
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {selectedImage ? (
                                        <div className="rounded-md border bg-muted/30 p-2">
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
                                                    className="max-h-40 rounded-md object-contain"
                                                />
                                            ) : null}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">
                                            Batas ukuran gambar: 5MB.
                                        </p>
                                    )}
                                </form>
                            </div>
                        </Card>
                    </div>

                    {/* Ticket Info */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Informasi Tiket
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Nomor Tiket
                                    </p>
                                    <p className="font-mono text-sm font-medium">
                                        {ticket.ticket_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Kategori
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {ticket.category}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Prioritas
                                    </p>
                                    <Badge
                                        className={getPriorityColor(
                                            ticket.priority,
                                        )}
                                    >
                                        {ticket.priority}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tingkat Kesulitan
                                    </p>
                                    <Badge
                                        className={getDifficultyColor(
                                            ticket.difficulty_level || 'medium',
                                        )}
                                    >
                                        {ticket.difficulty_level || 'medium'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Status
                                    </p>
                                    <Badge
                                        className={getStatusColor(
                                            ticket.status,
                                        )}
                                    >
                                        {ticket.status === 'in_progress'
                                            ? 'Dalam Proses'
                                            : ticket.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Pengguna
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="font-medium">
                                        {ticket.user.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {ticket.user.email}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Handle By
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {assignedAdminName ? (
                                    isCollabTicket ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-green-600">
                                                {`Collab (admin utama: ${assignedAdminName})`}
                                            </p>
                                            <div className="text-sm">
                                                <p className="font-medium">
                                                    Kolaborator:
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {collaboratorNames.length > 0
                                                        ? collaboratorNames.join(
                                                              ', ',
                                                          )
                                                        : 'Belum ada kolaborator'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium text-green-600">
                                            {`Sudah di handle oleh (${assignedAdminName})`}
                                        </p>
                                    )
                                ) : ticket.status === 'open' ? (
                                    <p className="text-sm text-muted-foreground">
                                        Belum di-handle
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Riwayat pengambilan tiket hanya dapat
                                        dilihat oleh pemilik akun.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Deskripsi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                    {ticket.description}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Galeri Bukti User
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {userImageMessages.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada screenshot dari user pada
                                        tiket ini.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-muted-foreground">
                                            Total bukti gambar:{' '}
                                            {userImageMessages.length}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {userImageMessages.map((msg) => (
                                                <a
                                                    key={msg.id}
                                                    href={msg.image_url ?? '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block overflow-hidden rounded-md border bg-muted/20"
                                                    title={
                                                        msg.image_original_name ||
                                                        `Bukti #${msg.id}`
                                                    }
                                                >
                                                    <img
                                                        src={
                                                            msg.image_url ?? ''
                                                        }
                                                        alt={
                                                            msg.image_original_name ||
                                                            `Bukti #${msg.id}`
                                                        }
                                                        className="h-28 w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {ticket.status === 'open' && (
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={handleTakeTicket}
                            >
                                Ambil Tiket
                            </Button>
                        )}

                        {ticket.status === 'in_progress' && (
                            <div className="space-y-2">
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={handleResolveTicket}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Tandai Terselesaikan
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleCloseTicket}
                                >
                                    <Clock className="mr-2 h-4 w-4" />
                                    Tutup Tiket
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminITLayout>
    );
}
