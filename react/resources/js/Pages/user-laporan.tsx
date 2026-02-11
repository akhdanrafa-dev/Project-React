import { usePage } from "@inertiajs/react"
import { Loader2, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"

import { TicketResolutionModal } from "@/components/ticket-resolution-modal"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import RootLayout from "@/layouts/app/RootLayouts"

interface BugTicket {
  id: number
  ticket_number: string
  title: string
  priority: string
  difficulty_level?: string
  status: string
  user_id: number
  assigned_to?: number | null
  created_at: string
  appeal_count?: number
  user?: {
    id: number
    name: string
    email: string
    phone?: string
  }
  assignedAdmin?: {
    id: number
    name: string
  } | null
}

export default function UserLaporanPage() {
  return (
    <RootLayout>
      <UserLaporanContent />
    </RootLayout>
  )
}

function UserLaporanContent() {
  const page = usePage()
  const { auth } = page.props as any
  const { toast } = useToast()
  const [tickets, setTickets] = useState<BugTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedResolutionTicket, setSelectedResolutionTicket] = useState<BugTicket | null>(null)
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false)
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
      const userTickets = data.filter((ticket: BugTicket) => ticket.user_id === auth.user.id)
      setTickets(userTickets)
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

  const getPriorityValue = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return 3
      case "medium":
        return 2
      case "low":
        return 1
      default:
        return 0
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <Badge variant="destructive">Tinggi</Badge>
      case "medium":
        return <Badge variant="default">Sedang</Badge>
      case "low":
        return <Badge variant="secondary">Rendah</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    const baseStatus = status.split(" ")[0].toLowerCase()
    
    switch (baseStatus) {
      case "open":
        return <Badge variant="outline">Terbuka</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500">Dalam Proses</Badge>
      case "resolved":
        return status.includes(" ") ? (
          <Badge className="bg-green-500">{status}</Badge>
        ) : (
          <Badge className="bg-green-500">Selesai</Badge>
        )
      case "diproses":
        return <Badge className="bg-orange-500">Diproses Kembali</Badge>
      case "closed":
        return <Badge className="bg-gray-500">Ditutup</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return <Badge className="bg-green-100 text-green-800">Mudah</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Sedang</Badge>
      case "hard":
        return <Badge className="bg-red-100 text-red-800">Susah</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">-</Badge>
    }
  }

  const openResolutionModal = (ticket: BugTicket) => {
    setSelectedResolutionTicket(ticket)
    setResolutionModalOpen(true)
  }

  const handleCompleteTicket = async (ticket: BugTicket) => {
    if (!confirm("Jika Anda menyelesaikan laporan ini maka Anda tidak bisa melakukan chat lagi ke admin. Apakah Anda yakin?")) {
      return
    }

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

      fetchTickets()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    }
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
    const closedTicketsCount = tickets.filter(t => t.status?.toLowerCase() === 'closed').length
    if (closedTicketsCount === 0) {
      toast({
        title: "Informasi",
        description: "Tidak ada laporan yang ditutup untuk dihapus",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${closedTicketsCount} laporan yang sudah ditutup? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setDeletingAllClosed(true)
    try {
      const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content")
      const closedTickets = tickets.filter(t => t.status?.toLowerCase() === 'closed')

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
        description: `${closedTicketsCount} laporan telah dihapus`,
      })

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

  const filteredTickets = tickets
    .filter(
      (ticket) =>
        ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const openTickets = filteredTickets.filter((t) => {
    const status = t.status?.toLowerCase() || ""
    return status !== "resolved" && status !== "closed" && status !== "diproses kembali"
  })
  const resolvedTickets = filteredTickets.filter((t) => {
    const status = t.status?.toLowerCase() || ""
    return status === "resolved" || status === "diproses kembali"
  })
  const closedTickets = filteredTickets.filter((t) => {
    const status = t.status?.toLowerCase() || ""
    return status === "closed"
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <SidebarTrigger />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span>Laporan</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Bug Saya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cari berdasarkan nomor tiket atau judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Separator />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Anda belum memiliki laporan bug
            </div>
          ) : (
            <div className="space-y-8">
              {openTickets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Tiket Terbuka</h3>
                    <Badge variant="outline">{openTickets.length}</Badge>
                  </div>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">ID</TableHead>
                          <TableHead>Judul</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Nomor Tiket</TableHead>
                          <TableHead>Prioritas</TableHead>
                          <TableHead>Tingkat Kesulitan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ditangani Oleh</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {openTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.id}</TableCell>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>
                              {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {ticket.ticket_number}
                            </TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>
                              {getDifficultyBadge(ticket.difficulty_level)}
                            </TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>
                              {ticket.assignedAdmin ? (
                                <span className="text-sm">{ticket.assignedAdmin.name}</span>
                              ) : (
                                <Badge variant="secondary">Belum di handle</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {resolvedTickets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Tiket Selesai (Menunggu Konfirmasi)</h3>
                    <Badge className="bg-green-600">{resolvedTickets.length}</Badge>
                  </div>
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">ID</TableHead>
                          <TableHead>Judul</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Nomor Tiket</TableHead>
                          <TableHead>Prioritas</TableHead>
                          <TableHead>Tingkat Kesulitan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ditangani Oleh</TableHead>
                          <TableHead className="w-48">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resolvedTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.id}</TableCell>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>
                              {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {ticket.ticket_number}
                            </TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>
                              {getDifficultyBadge(ticket.difficulty_level)}
                            </TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>
                              {ticket.assignedAdmin ? (
                                <span className="text-sm">{ticket.assignedAdmin.name}</span>
                              ) : (
                                <Badge variant="secondary">Belum di handle</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openResolutionModal(ticket)}
                                  variant="outline"
                                >
                                  Lihat Chat
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteTicket(ticket)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Selesaikan Laporan
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {closedTickets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Tiket Ditutup</h3>
                      <Badge variant="secondary">{closedTickets.length}</Badge>
                    </div>
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
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">ID</TableHead>
                          <TableHead>Judul</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Nomor Tiket</TableHead>
                          <TableHead>Prioritas</TableHead>
                          <TableHead>Tingkat Kesulitan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ditangani Oleh</TableHead>
                          <TableHead className="w-20">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {closedTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.id}</TableCell>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>
                              {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {ticket.ticket_number}
                            </TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>
                              {getDifficultyBadge(ticket.difficulty_level)}
                            </TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>
                              {ticket.assignedAdmin ? (
                                <span className="text-sm">{ticket.assignedAdmin.name}</span>
                              ) : (
                                <Badge variant="secondary">Belum di handle</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClosedTicket(ticket.id)}
                                disabled={deletingTicketId === ticket.id}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 gap-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                {deletingTicketId === ticket.id ? "..." : "Hapus"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Total: {filteredTickets.length} laporan bug
          </div>
        </CardContent>
      </Card>

      <TicketResolutionModal
        open={resolutionModalOpen}
        onOpenChange={setResolutionModalOpen}
        ticket={selectedResolutionTicket}
        onAppealSubmitted={fetchTickets}
        onClosed={fetchTickets}
      />
    </div>
  )
}
