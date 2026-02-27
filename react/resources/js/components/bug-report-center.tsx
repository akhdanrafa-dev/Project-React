import { MessageSquare, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

import { BugReportChat } from "./bug-report-chat"

interface ChatMessage {
  id: number
  user_id: number
  message: string
  image_url?: string | null
  image_original_name?: string | null
  image_size?: number | null
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
  assignedAdmin?: {
    id: number
    name: string
  } | null
  assigned_admin?: {
    id: number
    name: string
  } | null
  created_at: string
  messages?: ChatMessage[]
}

interface BugReportCenterProps {
  currentUserId: number
  currentUserRole?: string
  unreadCount?: number
}

export function BugReportCenter({
  currentUserId,
  currentUserRole = "",
  unreadCount: initialUnreadCount = 0,
}: BugReportCenterProps) {
  const [tickets, setTickets] = useState<BugTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<BugTicket | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [centerOpen, setCenterOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (centerOpen) {
      fetchTickets()
      checkUnreadCount()
    }
  }, [centerOpen])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/bug-tickets")
      if (!response.ok) throw new Error("Gagal mengambil ticket")

      const data = await response.json()
      setTickets(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data ticket",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkUnreadCount = async () => {
    try {
      const response = await fetch("/api/bug-tickets/unread-count", {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      if (!response.ok) throw new Error("Gagal mengambil unread count")

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        setUnreadCount(data.total_unread)
      }
    } catch (error) {
      console.error("Error checking unread count:", error)
    }
  }

  const openTicket = (ticket: BugTicket) => {
    setSelectedTicket(ticket)
    setChatOpen(true)
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
        return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low":
        return "Rendah"
      case "medium":
        return "Sedang"
      case "high":
        return "Tinggi"
      default:
        return priority
    }
  }

  const getAssignedAdminName = (ticket: BugTicket) => {
    return ticket.assignedAdmin?.name ?? ticket.assigned_admin?.name ?? null
  }

  return (
    <>
      <Dialog open={centerOpen} onOpenChange={setCenterOpen}>
        <DialogTrigger asChild>
          <Button
            className="relative hover:bg-purple-50 dark:hover:bg-purple-950"
            title="Pusat Laporan"
          >
            Buat Laporan
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs rounded-full font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Pusat Laporan Masalah
            </DialogTitle>
            <DialogDescription>
              Kelola semua laporan dan komunikasi dengan tim support kami
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <MessageSquare className="h-12 w-12 opacity-50" />
                <p>Belum ada laporan masalah</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {tickets.map((ticket) => {
                  const unreadMessages = ticket.messages?.filter(
                    (msg) => !msg.is_read && msg.user_id !== currentUserId
                  ).length ?? 0
                  const assignedAdminName = getAssignedAdminName(ticket)

                  return (
                    <div
                      key={ticket.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => openTicket(ticket)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            #{ticket.id} - {ticket.title}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {ticket.description}
                          </p>
                          {ticket.assigned_to ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Diambil oleh:{" "}
                              <span className="font-medium text-foreground">
                                {assignedAdminName ?? "Admin IT"}
                              </span>
                            </p>
                          ) : null}
                        </div>
                        {unreadMessages > 0 && (
                          <span className="flex items-center justify-center h-6 w-6 bg-red-500 text-white text-xs rounded-full font-bold flex-shrink-0">
                            {unreadMessages}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge variant="outline">
                          {getCategoryLabel(ticket.category)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                        </span>
                        <span>
                          {ticket.messages?.length ?? 0} pesan
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BugReportChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        ticket={selectedTicket}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </>
  )
}
