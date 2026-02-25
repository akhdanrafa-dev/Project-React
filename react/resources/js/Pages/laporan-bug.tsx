import { usePage } from "@inertiajs/react"
import { Loader2, Plus, MessageSquare, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

import { BugReportChat } from "@/components/bug-report-chat"
import { BugReportForm } from "@/components/bug-report-form"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useToast } from "@/components/ui/use-toast"
import RootLayout from "@/layouts/app/RootLayouts"


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
  created_at: string
  messages?: ChatMessage[]
}

export default function LaporanBugPage() {
  return (
    <RootLayout>
      <LaporanBugContent />
    </RootLayout>
  )
}

function LaporanBugContent() {
  const page = usePage()
  const { auth } = page.props as any
  const { toast } = useToast()
  const [tickets, setTickets] = useState<BugTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<BugTicket | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [deletingTicketId, setDeletingTicketId] = useState<number | null>(null)
  const [deletingAllClosed, setDeletingAllClosed] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

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
      })
    } finally {
      setLoading(false)
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

  const openTicket = (ticket: BugTicket) => {
    setSelectedTicket(ticket)
    setChatOpen(true)
  }

  const handleDeleteClosedTicket = async (ticketId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.")) {
      return
    }

    setDeletingTicketId(ticketId)
    try {
      const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content")
      const response = await fetch(`/api/bug-tickets/${ticketId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": csrfToken || "",
        },
        credentials: "same-origin",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Gagal menghapus tiket" }))
        throw new Error(error.message || "Gagal menghapus tiket")
      }

      toast({
        title: "Sukses",
        description: "Laporan telah dihapus",
      })

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null)
        setChatOpen(false)
      }

      fetchTickets()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setDeletingTicketId(null)
    }
  }

  const handleDeleteAllClosedTickets = async () => {
    const closedTickets = tickets.filter((ticket) => ticket.status === "closed")
    if (closedTickets.length === 0) {
      toast({
        title: "Informasi",
        description: "Tidak ada laporan yang ditutup untuk dihapus",
      })
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${closedTickets.length} laporan yang sudah ditutup? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setDeletingAllClosed(true)
    try {
      const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content")

      for (const ticket of closedTickets) {
        const response = await fetch(`/api/bug-tickets/${ticket.id}`, {
          method: "DELETE",
          headers: {
            "X-CSRF-Token": csrfToken || "",
          },
          credentials: "same-origin",
        })

        if (!response.ok) {
          throw new Error(`Gagal menghapus laporan ${ticket.id}`)
        }
      }

      toast({
        title: "Sukses",
        description: `${closedTickets.length} laporan telah dihapus`,
      })

      if (selectedTicket && closedTickets.some((ticket) => ticket.id === selectedTicket.id)) {
        setSelectedTicket(null)
        setChatOpen(false)
      }

      fetchTickets()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setDeletingAllClosed(false)
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = !filterStatus || ticket.status === filterStatus
    const showClosed = filterStatus === 'closed'
    const isClosed = ticket.status === 'closed'
    return matchSearch && matchStatus && (!isClosed || showClosed)
  })
  const closedTickets = tickets.filter((ticket) => ticket.status === "closed")

  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/laporan-bug">Laporan Bug</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">Laporan Bug & Support</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Kelola semua laporan masalah dan komunikasi dengan tim support
            </p>
          </div>
          <div className="flex-shrink-0">
            <BugReportForm onSuccess={fetchTickets} />
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Cari berdasarkan judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm"
            />
            <div className="flex flex-wrap gap-1 md:gap-2">
              <Button
                variant={!filterStatus ? "default" : "outline"}
                onClick={() => setFilterStatus(null)}
                size="sm"
                className="text-xs md:text-sm"
              >
                Semua
              </Button>
              <Button
                variant={filterStatus === "open" ? "default" : "outline"}
                onClick={() => setFilterStatus("open")}
                size="sm"
                className="text-xs md:text-sm"
              >
                Terbuka
              </Button>
              <Button
                variant={filterStatus === "in_progress" ? "default" : "outline"}
                onClick={() => setFilterStatus("in_progress")}
                size="sm"
                className="text-xs md:text-sm"
              >
                Sedang Diproses
              </Button>
              <Button
                variant={filterStatus === "resolved" ? "default" : "outline"}
                onClick={() => setFilterStatus("resolved")}
                size="sm"
                className="text-xs md:text-sm"
              >
                Terselesaikan
              </Button>
              <Button
                variant={filterStatus === "closed" ? "default" : "outline"}
                onClick={() => setFilterStatus("closed")}
                size="sm"
                className="text-xs md:text-sm"
              >
                Ditutup
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MessageSquare className="h-12 w-12 opacity-50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Belum ada laporan</p>
              <BugReportForm onSuccess={fetchTickets} />
            </CardContent>
          </Card>
        ) : (
          <>
            {filterStatus === "closed" && closedTickets.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <p className="text-sm text-muted-foreground">
                  Total tiket ditutup: {closedTickets.length}
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteAllClosedTickets}
                  disabled={deletingAllClosed}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingAllClosed ? "Menghapus..." : "Hapus Semua"}
                </Button>
              </div>
            )}
            <div className="grid gap-4">
            {filteredTickets.map((ticket) => {
              const unreadMessages = ticket.messages?.filter(
                (msg) => !msg.is_read && msg.user_id !== auth.user.id
              ).length ?? 0

              return (
                <Card
                  key={ticket.id}
                  className="hover:shadow-md cursor-pointer transition-all border-l-4 border-l-blue-500"
                  onClick={() => openTicket(ticket)}
                >
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-blue-600 text-white shadow-sm whitespace-nowrap">
                            No. Tiket: {ticket.ticket_number || `#${ticket.id}`}
                          </span>
                          {unreadMessages > 0 && (
                            <span className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 bg-red-500 text-white text-xs rounded-full font-bold flex-shrink-0">
                              {unreadMessages}
                            </span>
                          )}
                        </div>
                        {ticket.status === "closed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteClosedTicket(ticket.id)
                            }}
                            disabled={deletingTicketId === ticket.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingTicketId === ticket.id ? "..." : "Hapus"}
                          </Button>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm md:text-base truncate" title={ticket.title}>
                          {ticket.title}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 mt-1" title={ticket.description}>
                          {ticket.description}
                        </p>
                      </div>
                    </div>

                    <Separator className="mb-3 md:mb-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="flex flex-wrap gap-1">
                        <Badge className={`${getPriorityColor(ticket.priority)} text-xs md:text-sm`}>
                          Prioritas: {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={`${getStatusColor(ticket.status)} text-xs md:text-sm`}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-3 md:pt-4 border-t gap-3">
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <span>{getCategoryLabel(ticket.category)}</span>
                        <span className="hidden md:inline">•</span>
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span className="hidden md:inline">•</span>
                        <span>{ticket.messages?.length ?? 0} pesan</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openTicket(ticket)
                        }}
                        className="w-full md:w-auto text-xs md:text-sm"
                      >
                        <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Lihat Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            </div>
          </>
        )}
      </div>

      <BugReportChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        ticket={selectedTicket}
        currentUserId={auth.user.id}
        currentUserRole={typeof auth.user?.role === "string" ? auth.user.role : ""}
      />
    </>
  )
}
