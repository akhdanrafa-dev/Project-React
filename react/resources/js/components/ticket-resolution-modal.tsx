import { AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

interface TicketResolutionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: {
    id: number
    ticket_number: string
    title: string
    appeal_count?: number
  } | null
  onAppealSubmitted?: () => void
  onClosed?: () => void
}

const MAX_APPEALS = 3

export function TicketResolutionModal({
  open,
  onOpenChange,
  ticket,
  onAppealSubmitted,
  onClosed,
}: TicketResolutionModalProps) {
  const [appealReason, setAppealReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAppealForm, setShowAppealForm] = useState(false)
  const { toast } = useToast()

  if (!ticket) return null

  const remainingAppeals = MAX_APPEALS - (ticket.appeal_count || 0)
  const canAppeal = remainingAppeals > 0

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!appealReason.trim()) {
      toast({
        title: "Validasi Gagal",
        description: "Alasan aju banding tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content")

      const response = await fetch(`/api/bug-tickets/${ticket.id}/appeal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          reason: appealReason,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Gagal mengajukan banding" }))
        throw new Error(error.message || "Gagal mengajukan banding")
      }

      toast({
        title: "Sukses",
        description: "Aju banding telah diajukan. Tim kami akan meninjau kembali laporan Anda.",
      })

      setAppealReason("")
      setShowAppealForm(false)
      onOpenChange(false)
      onAppealSubmitted?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!confirm("Apakah Anda yakin ingin menutup tiket ini? Setelah ditutup, Anda tidak dapat lagi melakukan chat dengan admin.")) {
      return
    }

    setLoading(true)

    try {
      const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content")

      const response = await fetch(`/api/bug-tickets/${ticket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          status: "closed",
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Gagal menutup tiket" }))
        throw new Error(error.message || "Gagal menutup tiket")
      }

      toast({
        title: "Sukses",
        description: "Tiket telah ditutup.",
      })

      onOpenChange(false)
      onClosed?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Selesaikan Tiket</DialogTitle>
          <DialogDescription>
            Tiket #{ticket.ticket_number} - {ticket.title}
          </DialogDescription>
        </DialogHeader>

        {!showAppealForm ? (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Apakah Anda puas dengan solusi ini?</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAppealForm(true)}
                  disabled={!canAppeal}
                  variant="outline"
                  className="flex-1"
                >
                  Tidak, Aju Banding
                </Button>
                <Button
                  onClick={handleCloseTicket}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Ya, Tutup Tiket
                </Button>
              </div>
            </div>

            {!canAppeal && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Anda telah mencapai batas maksimal aju banding (3x). Untuk menyelesaikan, silakan tutup tiket ini.
                </AlertDescription>
              </Alert>
            )}

            {canAppeal && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Anda masih memiliki {remainingAppeals} aju banding tersisa dari maksimal 3 kali.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitAppeal} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan Aju Banding *</label>
              <Textarea
                placeholder="Jelaskan mengapa Anda tidak puas dengan solusi ini dan apa yang ingin Anda perbaiki..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={5}
                className="resize-none"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Alasan tidak boleh kosong. Tim kami akan meninjau ulang dan menghubungi Anda kembali.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Anda memiliki {remainingAppeals} aju banding tersisa dari maksimal 3 kali.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAppealForm(false)
                  setAppealReason("")
                }}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || !appealReason.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Ajukan Banding
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
