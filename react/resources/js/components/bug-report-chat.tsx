import { Send, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

interface ChatMessage {
  id: number
  user_id: number
  message: string
  is_read: boolean
  created_at: string
  user?: {
    id: number
    name: string
    email: string
  }
}

interface BugTicket {
  id: number
  ticket_number: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  user_id: number
  assigned_to?: number | null
  created_at: string
  appeal_count?: number
  messages?: ChatMessage[]
}

interface BugReportChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: BugTicket | null
  currentUserId: number
  currentUserRole?: string
}

const getCsrfToken = () => {
  return (
    document.querySelector("meta[name='csrf-token']")?.getAttribute("content") ?? ""
  )
}

export function BugReportChat({
  open,
  onOpenChange,
  ticket,
  currentUserId,
  currentUserRole = "",
}: BugReportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [completingTicket, setCompletingTicket] = useState(false)
  const [appealReason, setAppealReason] = useState("")
  const [showAppealForm, setShowAppealForm] = useState(false)
  const [submittingAppeal, setSubmittingAppeal] = useState(false)
  const [markingAsResolved, setMarkingAsResolved] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const MAX_APPEALS = 3
  const remainingAppeals = MAX_APPEALS - (ticket?.appeal_count || 0)
  const canAppeal = remainingAppeals > 0

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (open && ticket) {
      fetchMessages()
    }
  }, [open, ticket])

  const fetchMessages = async () => {
    if (!ticket) return

    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/bug-tickets/${ticket.id}/messages`, {
        headers: {
          "Accept": "application/json",
        },
        credentials: "same-origin",
      })
      if (!response.ok) throw new Error("Gagal mengambil pesan")

      const data = await response.json()
      setMessages(data)

      // Mark messages as read
      await fetch(`/api/bug-tickets/${ticket.id}/messages/mark-all-as-read`, {
        method: "PATCH",
        headers: {
          "X-CSRF-Token": getCsrfToken(),
          "Accept": "application/json",
        },
        credentials: "same-origin",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil pesan",
        variant: "destructive",
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !ticket) return

    setLoading(true)

    try {
      const response = await fetch(`/api/bug-tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
          "Accept": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ message: newMessage }),
      })

      if (!response.ok) throw new Error("Gagal mengirim pesan")

      const data = await response.json()
      setMessages([...messages, data])
      setNewMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengirim pesan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

    if (appealReason.trim().length < 10) {
      toast({
        title: "Validasi Gagal",
        description: "Alasan aju banding minimal 10 karakter",
        variant: "destructive",
      })
      return
    }

    if (!ticket) return

    setSubmittingAppeal(true)

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
        const contentType = response.headers.get("content-type")
        let error
        if (contentType?.includes("application/json")) {
          error = await response.json()
        } else {
          const text = await response.text()
          console.error("Non-JSON response:", text)
          error = { message: `Error ${response.status}: ${response.statusText}` }
        }
        throw new Error(error.message || "Gagal mengajukan banding")
      }

      toast({
        title: "Sukses",
        description: "Aju banding telah diajukan. Tim kami akan meninjau kembali laporan Anda.",
      })

      setAppealReason("")
      setShowAppealForm(false)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setSubmittingAppeal(false)
    }
  }

  const handleCompleteTicket = async () => {
    if (!ticket) return

    if (!confirm("Jika Anda menyelesaikan laporan ini maka Anda tidak bisa melakukan chat lagi ke admin. Apakah Anda yakin?")) {
      return
    }

    setCompletingTicket(true)

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
        const error = await response.json().catch(() => ({ message: "Gagal menyelesaikan tiket" }))
        throw new Error(error.message || "Gagal menyelesaikan tiket")
      }

      toast({
        title: "Sukses",
        description: "Laporan telah ditutup. Anda tidak dapat lagi mengirim pesan untuk tiket ini.",
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setCompletingTicket(false)
    }
  }

  const handleMarkAsResolved = async () => {
    if (!ticket) return

    setMarkingAsResolved(true)

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
          status: "resolved",
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Gagal memperbarui tiket" }))
        throw new Error(error.message || "Gagal memperbarui tiket")
      }

      toast({
        title: "Sukses",
        description: "Tiket telah diubah kembali ke status Terselesaikan.",
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setMarkingAsResolved(false)
    }
  }

  if (!ticket) return null

  const isAdminIT = currentUserRole === "admin_it"
  const isTicketOwner = ticket.user_id === currentUserId

  const getStatusColor = (status: string) => {
    const baseStatus = status.split(" ")[0]
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "diproses":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "diproses kembali":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Terbuka"
      case "in_progress":
        return "Sedang Diproses"
      case "resolved":
        return "Terselesaikan"
      case "closed":
        return "Ditutup"
      default:
        if (status.startsWith("resolved")) {
          return status.replace("resolved", "Terselesaikan")
        }
        if (status === "diproses kembali") {
          return "Diproses Kembali"
        }
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "bug":
        return "🐛 Bug"
      case "feedback":
        return "💡 Feedback"
      case "complaint":
        return "😞 Keluhan"
      default:
        return category
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-blue-600 text-white shadow-sm">
              No. Tiket: {ticket.ticket_number || `#${ticket.id}`}
            </span>
            <DialogTitle className="flex-1 text-base md:text-lg truncate">{ticket.title}</DialogTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">
              {getCategoryLabel(ticket.category)}
            </Badge>
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority === "low"
                ? "Prioritas: Rendah"
                : ticket.priority === "medium"
                  ? "Prioritas: Sedang"
                  : "Prioritas: Tinggi"}
            </Badge>
            <Badge className={getStatusColor(ticket.status)}>
              {getStatusLabel(ticket.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Belum ada pesan. Mulai percakapan dengan tim support kami!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.user_id === currentUserId
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback>
                          {message.user?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col gap-1 max-w-xs`}>
                      {!isCurrentUser && (
                        <p className="text-xs text-muted-foreground font-medium">
                          {message.user?.name}
                        </p>
                      )}
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          isCurrentUser
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-slate-800 text-foreground border"
                        }`}
                      >
                        <p className="text-sm break-words">{message.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {isCurrentUser && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback>Anda</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input & Appeal Section */}
          <div className="border-t p-4 space-y-3">
            {ticket.status === "closed" ? (
              <div className="p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
                Chat telah ditutup karena tiket ini sudah ditutup.
              </div>
            ) : ticket.status === "diproses kembali" ? (
              isAdminIT ? (
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Status: Diproses Kembali</p>
                  <p className="text-sm text-blue-800">
                    Tiket ini memiliki aju banding. Setelah meninjau, pilih salah satu:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleMarkAsResolved}
                      disabled={markingAsResolved}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {markingAsResolved ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                      Tetap Resolved
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={markingAsResolved}
                      className="text-blue-600 border-blue-200"
                    >
                      Perbaharui Solusi & Chat
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    Aju banding sedang ditinjau Admin IT. Mohon tunggu pembaruan dari tim support.
                  </AlertDescription>
                </Alert>
              )
            ) : ticket.status?.toLowerCase() === "resolved" && !showAppealForm && isTicketOwner ? (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Apakah Anda puas dengan solusi ini?</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => setShowAppealForm(true)}
                      disabled={!canAppeal}
                      variant="outline"
                      size="sm"
                    >
                      Tidak, Aju Banding
                    </Button>
                    <Button
                      onClick={handleCompleteTicket}
                      disabled={completingTicket}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {completingTicket ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                      Ya, Selesaikan Laporan
                    </Button>
                  </div>
                  {!canAppeal && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertDescription className="text-red-700 text-xs">
                        Anda telah mencapai batas maksimal aju banding (3x).
                      </AlertDescription>
                    </Alert>
                  )}
                  {canAppeal && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-blue-700 text-xs">
                        Anda memiliki {remainingAppeals} aju banding tersisa dari maksimal 3 kali.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            ) : (
              <>
                {showAppealForm && ticket.status?.toLowerCase() === "resolved" && isTicketOwner ? (
                  <form onSubmit={handleSubmitAppeal} className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Alasan Aju Banding *</label>
                      <Textarea
                        placeholder="Jelaskan mengapa Anda tidak puas dengan solusi ini dan apa yang ingin Anda perbaiki..."
                        value={appealReason}
                        onChange={(e) => setAppealReason(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={submittingAppeal}
                      />
                      <p className="text-xs text-muted-foreground">
                        Alasan minimal 10 karakter. Tim kami akan meninjau ulang dan menghubungi Anda kembali. ({appealReason.length}/10)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAppealForm(false)
                          setAppealReason("")
                        }}
                        disabled={submittingAppeal}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submittingAppeal || !appealReason.trim() || appealReason.trim().length < 10}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {submittingAppeal ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                        Ajukan Banding
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Textarea
                      placeholder="Ketik pesan Anda..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          handleSendMessage(e)
                        }
                      }}
                      rows={2}
                      className="resize-none"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={loading || !newMessage.trim()}
                      className="self-end"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
