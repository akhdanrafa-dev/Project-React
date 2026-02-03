import { useState, useEffect } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useToast } from "@/components/ui/use-toast"
import RootLayout from "@/layouts/app/RootLayouts"
import { Loader2 } from "lucide-react"

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

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Mudah" },
  { value: "medium", label: "Sedang" },
  { value: "hard", label: "Sulit" },
]

export default function DeveloperToolsPage() {
  return (
    <RootLayout>
      <DeveloperToolsContent />
    </RootLayout>
  )
}

function DeveloperToolsContent() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<BugTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingTicketId, setUpdatingTicketId] = useState<number | null>(null)

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
    switch (status?.toLowerCase()) {
      case "open":
        return <Badge variant="outline">Terbuka</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500">Dalam Proses</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Selesai</Badge>
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
        return <Badge className="bg-red-100 text-red-800">Sulit</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Sedang</Badge>
    }
  }

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  }

  const updateDifficulty = async (ticketId: number, difficulty: string) => {
    setUpdatingTicketId(ticketId)

    try {
      const csrfToken = getCsrfToken()
      
      // Prepare body - jika difficulty kosong, kirim sebagai null
      const bodyData: any = {}
      if (difficulty) {
        bodyData.difficulty_level = difficulty
      } else {
        bodyData.difficulty_level = null
      }
      
      const response = await fetch(`/api/bug-tickets/${ticketId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": csrfToken || "",
        },
        body: JSON.stringify(bodyData),
      })

      const contentType = response.headers.get("content-type") ?? ""
      const payload = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() }

      if (!response.ok) {
        const errorMsg = payload?.message || payload?.error || `Error ${response.status}`
        throw new Error(errorMsg)
      }

      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, difficulty_level: difficulty || undefined }
            : ticket
        )
      )

      toast({
        title: "Sukses",
        description: "Tingkat kesulitan berhasil diubah",
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal mengubah tingkat kesulitan"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUpdatingTicketId(null)
    }
  }

  const filteredTickets = tickets
    .filter(
      (ticket) =>
        ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Urutkan berdasarkan prioritas (tinggi ke rendah)
      const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority)
      if (priorityDiff !== 0) return priorityDiff
      // Jika prioritas sama, urutkan berdasarkan waktu (yang pertama masuk di atas)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
              <BreadcrumbLink href="/developer-dashboard">Dashboard</BreadcrumbLink>
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
          <CardTitle>Laporan Bug Masuk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cari berdasarkan nomor tiket, username, atau email..."
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
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Id</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nomor Tiket</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Kesulitan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Handle By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets && filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>{ticket.user?.name || "N/A"}</TableCell>
                        <TableCell>{ticket.user?.email || "N/A"}</TableCell>
                        <TableCell>
                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDifficultyBadge(ticket.difficulty_level)}
                            <select
                              value={ticket.difficulty_level || ""}
                              onChange={(e) => updateDifficulty(ticket.id, e.target.value)}
                              disabled={updatingTicketId === ticket.id}
                              className="text-xs px-2 py-1 border rounded bg-white cursor-pointer disabled:opacity-50"
                              aria-label="Ubah tingkat kesulitan"
                            >
                              <option value="">-</option>
                              {DIFFICULTY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Tidak ada data bug ticket
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Total: {filteredTickets.length} bug ticket
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
