import { Clock3, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { fetchWithCsrfRetry } from '@/lib/csrf';
import {
    canEditTicketEstimate,
    formatTicketEstimate,
    formatTicketEstimateInputValue,
    getTicketEstimateActorName,
    TicketEstimateData,
    toEstimateIsoString,
} from '@/lib/ticket-estimate';

interface TicketEstimateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: TicketEstimateData | null;
    currentUserRole?: string;
    currentUserId?: number;
    onUpdated?: (ticket: TicketEstimateData) => void;
}

export function TicketEstimateDialog({
    open,
    onOpenChange,
    ticket,
    currentUserRole,
    currentUserId,
    onUpdated,
}: TicketEstimateDialogProps) {
    const { toast } = useToast();
    const [estimateInput, setEstimateInput] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;

        setEstimateInput(
            formatTicketEstimateInputValue(ticket?.estimated_completion_at),
        );
        setReason('');
    }, [open, ticket?.estimated_completion_at, ticket?.id]);

    const canEdit = useMemo(
        () => canEditTicketEstimate(ticket, currentUserRole, currentUserId),
        [ticket, currentUserId, currentUserRole],
    );
    const isDeveloperSuggestionMode = currentUserRole === 'developer';
    const actorName = getTicketEstimateActorName(ticket);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!ticket || !canEdit || submitting) return;
        if (!estimateInput) {
            toast({
                title: isDeveloperSuggestionMode
                    ? 'Saran estimasi belum diisi'
                    : 'Estimasi belum diisi',
                description: isDeveloperSuggestionMode
                    ? 'Silakan pilih tanggal dan waktu saran estimasi.'
                    : 'Silakan pilih tanggal dan waktu estimasi.',
                variant: 'destructive',
            });
            return;
        }

        if (isDeveloperSuggestionMode && reason.trim().length < 10) {
            toast({
                title: 'Alasan wajib diisi',
                description:
                    'Developer wajib memberi alasan minimal 10 karakter saat mengirim saran estimasi.',
                variant: 'destructive',
            });
            return;
        }

        const estimatedCompletionAt = toEstimateIsoString(estimateInput);
        if (!estimatedCompletionAt) {
            toast({
                title: 'Format estimasi tidak valid',
                description: 'Tanggal estimasi tidak dapat diproses.',
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetchWithCsrfRetry(
                `/api/bug-tickets/${ticket.id}/estimate`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        estimated_completion_at: estimatedCompletionAt,
                        reason: reason.trim() || undefined,
                    }),
                },
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                const validationMessage = data?.errors
                    ? (Object.values(data.errors).flat()[0] as
                          | string
                          | undefined)
                    : undefined;

                throw new Error(
                    validationMessage ||
                        data?.message ||
                        (isDeveloperSuggestionMode
                            ? 'Gagal mengirim saran estimasi'
                            : 'Gagal memperbarui estimasi'),
                );
            }

            if (data?.ticket) {
                onUpdated?.(data.ticket as TicketEstimateData);
            }

            toast({
                title: isDeveloperSuggestionMode
                    ? 'Saran dikirim'
                    : 'Estimasi diperbarui',
                description:
                    data?.message ||
                    (isDeveloperSuggestionMode
                        ? 'Saran estimasi berhasil dikirim.'
                        : 'Estimasi selesai berhasil diperbarui.'),
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: isDeveloperSuggestionMode
                    ? 'Gagal mengirim saran'
                    : 'Gagal memperbarui estimasi',
                description:
                    error instanceof Error
                        ? error.message
                        : isDeveloperSuggestionMode
                          ? 'Terjadi kesalahan saat mengirim saran estimasi.'
                          : 'Terjadi kesalahan saat menyimpan estimasi.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {isDeveloperSuggestionMode
                            ? 'Saran Estimasi'
                            : 'Estimasi Selesai'}
                    </DialogTitle>
                    <DialogDescription>
                        {isDeveloperSuggestionMode
                            ? 'Kirim saran estimasi selesai ke Admin IT tanpa mengubah estimasi resmi tiket.'
                            : ticket?.estimated_completion_at
                              ? 'Lihat atau perbarui estimasi selesai tiket.'
                              : 'Tetapkan estimasi selesai untuk tiket ini.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Estimasi Saat Ini
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                            {formatTicketEstimate(
                                ticket?.estimated_completion_at ?? null,
                            )}
                        </p>
                        {actorName ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Terakhir diatur oleh {actorName}
                                {ticket?.estimate_updated_at
                                    ? ` pada ${formatTicketEstimate(ticket.estimate_updated_at)}`
                                    : ''}
                            </p>
                        ) : !ticket?.estimated_completion_at ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Belum ada estimasi yang ditetapkan.
                            </p>
                        ) : null}
                        {ticket?.estimate_change_reason ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Alasan terakhir: {ticket.estimate_change_reason}
                            </p>
                        ) : null}
                    </div>

                    {canEdit ? (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="ticket-estimate-input">
                                    {isDeveloperSuggestionMode
                                        ? 'Saran estimasi selesai'
                                        : 'Estimasi selesai'}
                                </Label>
                                <Input
                                    id="ticket-estimate-input"
                                    type="datetime-local"
                                    value={estimateInput}
                                    onChange={(event) =>
                                        setEstimateInput(event.target.value)
                                    }
                                    min={formatTicketEstimateInputValue(
                                        new Date().toISOString(),
                                    )}
                                    disabled={submitting}
                                />
                            </div>

                            {isDeveloperSuggestionMode ? (
                                <div className="space-y-2">
                                    <Label htmlFor="ticket-estimate-reason">
                                        Alasan saran
                                    </Label>
                                    <Textarea
                                        id="ticket-estimate-reason"
                                        value={reason}
                                        onChange={(event) =>
                                            setReason(event.target.value)
                                        }
                                        placeholder="Jelaskan alasan developer menyarankan perubahan estimasi selesai..."
                                        disabled={submitting}
                                        rows={4}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Developer hanya dapat menyarankan estimasi. Estimasi resmi tetap diubah oleh Admin IT.
                                    </p>
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={submitting}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {isDeveloperSuggestionMode
                                        ? 'Kirim Saran'
                                        : 'Simpan Estimasi'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            {ticket?.estimated_completion_at
                                ? 'Anda dapat melihat estimasi ini, tetapi tidak memiliki izin untuk mengubahnya.'
                                : 'Estimasi belum ditetapkan oleh Admin IT.'}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
