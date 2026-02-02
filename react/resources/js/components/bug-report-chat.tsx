import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Loader2 } from "lucide-react"

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
  messages?: ChatMessage[]
}

interface BugReportChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: BugTicket | null
  currentUserId: number
}

export function BugReportChat({
  open,
  onOpenChange,
  ticket,
  currentUserId,
}: BugReportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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
      const response = await fetch(`/api/bug-tickets/${ticket.id}/messages`)
      if (!response.ok) throw new Error("Gagal mengambil pesan")

      const data = await response.json()
      setMessages(data)

      // Mark messages as read
      await fetch(`/api/bug-tickets/${ticket.id}/messages/mark-all-as-read`, {
        method: "PATCH",
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
        },
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

  if (!ticket) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800"
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
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
              {ticket.status === "open"
                ? "Terbuka"
                : ticket.status === "in_progress"
                  ? "Sedang Diproses"
                  : ticket.status === "resolved"
                    ? "Terselesaikan"
                    : "Ditutup"}
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

          {/* Message Input */}
          <div className="border-t p-4">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
