import { Head, usePage } from '@inertiajs/react'
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { BugReportChat } from '@/components/bug-report-chat'
import { TicketEstimateDialog } from '@/components/ticket-estimate-dialog'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar-trigger'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AdminITLayout from '@/layouts/app/AdminITLayout'
import { fetchWithCsrfRetry } from '@/lib/csrf'
import { TicketEstimateData } from '@/lib/ticket-estimate'
import {
  getPendingEstimateDeadline,
  getPendingEstimateRemainingLabel,
  getTicketStatusLabel,
  normalizeTicketStatus,
  TICKET_STATUS,
} from '@/lib/ticket-status'
import { formatTicketLocalDateTime } from '@/lib/ticket-timing'
import type { SharedData } from '@/types'

interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  difficulty_level?: string | null
  category: string
  created_at: string
  taken_at?: string | null
  user_id: number
  user: {
    id: number
    name: string
    email: string
  }
  assigned_to: number | null
  appeal_count?: number
  estimated_completion_at?: string | null
  estimate_updated_at?: string | null
  estimate_change_reason?: string | null
  estimateUpdatedBy?: {
    id: number
    name: string
  } | null
  estimate_updated_by_user?: {
    id: number
    name: string
  } | null
}

export default function AdminITDashboard() {
  const { auth } = usePage<SharedData>().props
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedEstimateTicket, setSelectedEstimateTicket] = useState<Ticket | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const currentUserId = auth.user?.id ?? 0

  const openTicketChat = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setChatOpen(true)
  }

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/bug-tickets')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch tickets' }))
          throw new Error(errorData.message || `Failed to fetch tickets (${response.status})`)
        }
        const data = await response.json()
        setTickets(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchUnreadNotificationCount = async () => {
      try {
        const response = await fetch('/api/admin-it/notifications/unread-count', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch unread notifications')
        }

        const data = await response.json()

        if (isMounted) {
          setUnreadNotificationCount(Number(data.unread_count ?? 0))
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchUnreadNotificationCount()

    const interval = setInterval(fetchUnreadNotificationCount, 15000)
    const handleFocus = () => {
      fetchUnreadNotificationCount()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleTakeTicket = async (ticketId: number) => {
    try {
      const userId = auth.user?.id
      if (!userId) {
        setError('User ID tidak ditemukan. Silakan refresh halaman.')
        return
      }

      const response = await fetchWithCsrfRetry(`/api/bug-tickets/${ticketId}/take`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          assigned_to: userId,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to take ticket (${response.status})`)
      }
      const updatedTicket = await response.json()
      setTickets((prevTickets) =>
        prevTickets.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'pending_estimate':
        return 'bg-amber-100 text-amber-800'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'diproses kembali':
        return 'bg-orange-100 text-orange-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Terbuka'
      case 'pending_estimate':
        return 'Menunggu Estimasi Pengerjaan'
      case 'in_progress':
        return 'Sedang Diproses'
      case 'resolved':
        return 'Menunggu Verifikasi'
      case 'diproses kembali':
        return 'Diproses Kembali'
      case 'closed':
        return 'Ditutup'
      default:
        return status
    }
  }

  const getDifficultyColor = (difficulty?: string | null) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty?: string | null) => {
    switch (difficulty) {
      case 'easy':
        return 'Mudah'
      case 'medium':
        return 'Sedang'
      case 'hard':
        return 'Sulit'
      default:
        return 'Belum di tentukan'
    }
  }

  const openTickets = tickets.filter(
    (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.OPEN,
  )
  const pendingEstimateTickets = tickets.filter(
    (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.PENDING_ESTIMATE,
  )
  const myPendingEstimateTickets = pendingEstimateTickets.filter(
    (ticket) => ticket.assigned_to === currentUserId,
  )
  const inProgressTickets = tickets.filter(
    (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.IN_PROGRESS,
  )
  const resolvedTickets = tickets.filter(
    (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.RESOLVED,
  )
  const closedTickets = tickets.filter(
    (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.CLOSED,
  )
  if (loading) {
    return (
      <AdminITLayout>
        <div className="p-6">
          <div>Loading...</div>
        </div>
      </AdminITLayout>
    )
  }

  return (
    <AdminITLayout>
      <Head title="Admin IT Dashboard" />

      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin-it-dashboard">Admin IT Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin IT Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kelola laporan pengguna dan tangani masalah teknis
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

        {/* Stats Cards */}
        {unreadNotificationCount > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base text-amber-900">
                Notifikasi Baru
              </CardTitle>
              <CardDescription className="text-amber-800">
                Anda mendapat notifikasi baru.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-amber-900">
                {unreadNotificationCount} notifikasi tiket belum dibaca.
              </p>
              <Button asChild type="button" variant="outline">
                <a href="/admin-it/notifications">Buka riwayat notifikasi</a>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiket Terbuka</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTickets.length}</div>
              <p className="text-xs text-muted-foreground">Menunggu penugasan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Estimasi Pengerjaan</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingEstimateTickets.length}</div>
              <p className="text-xs text-muted-foreground">Sudah diambil, estimasi belum diatur</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sedang Diproses</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTickets.length}</div>
              <p className="text-xs text-muted-foreground">Sedang ditangani</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedTickets.length}</div>
              <p className="text-xs text-muted-foreground">Masalah terpecahkan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditutup</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closedTickets.length}</div>
              <p className="text-xs text-muted-foreground">Tiket ditutup</p>
            </CardContent>
          </Card>
        </div>

        {/* Open Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tiket yang Tersedia</CardTitle>
            <CardDescription>
              Daftar laporan yang dapat Anda ambil dan tangani
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Tiket</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Kesulitan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Waktu Masuk</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openTickets.map(ticket => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell className="max-w-xs truncate font-medium">
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {ticket.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getDifficultyColor(ticket.difficulty_level)}>
                            {getDifficultyLabel(ticket.difficulty_level)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getTicketStatusLabel(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-sm">{ticket.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTicketLocalDateTime(ticket.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleTakeTicket(ticket.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Ambil Tiket
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {openTickets.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Tidak ada tiket terbuka</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Current Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Tiket Saya yang Menunggu Estimasi Pengerjaan</CardTitle>
            <CardDescription>
              Tiket yang sudah Anda ambil namun estimasi selesai belum ditentukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Tiket</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Kesulitan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Waktu Masuk</TableHead>
                    <TableHead>Batas Atur Estimasi</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myPendingEstimateTickets.map(ticket => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell className="max-w-xs truncate font-medium">
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {ticket.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getDifficultyColor(ticket.difficulty_level)}>
                            {getDifficultyLabel(ticket.difficulty_level)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-sm">{ticket.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTicketLocalDateTime(ticket.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {formatTicketLocalDateTime(getPendingEstimateDeadline(ticket))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getPendingEstimateRemainingLabel(ticket) ?? '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => setSelectedEstimateTicket(ticket)}
                          >
                            Atur Estimasi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {myPendingEstimateTickets.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Tidak ada tiket yang belum diproses</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appeals to Review */}
        <Card>
          <CardHeader>
            <CardTitle>Tiket Aju Banding</CardTitle>
            <CardDescription>
              Tiket yang memiliki aju banding dan perlu di-review kembali
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Tiket</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Kesulitan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Aju Banding</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets
                    .filter(ticket => ticket.status === 'diproses kembali')
                    .map(ticket => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell className="max-w-xs truncate font-medium">
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {ticket.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getDifficultyColor(ticket.difficulty_level)}>
                            {getDifficultyLabel(ticket.difficulty_level)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-sm">{ticket.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-orange-50">
                            Menunggu Review
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => openTicketChat(ticket)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {tickets.filter(t => t.status === 'diproses kembali').length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Tidak ada tiket aju banding</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <BugReportChat
        open={chatOpen}
        onOpenChange={(open) => {
          setChatOpen(open)
          if (!open) {
            setSelectedTicket(null)
          }
        }}
        ticket={selectedTicket}
        currentUserId={currentUserId}
        currentUserRole={typeof auth.user?.role === "string" ? auth.user.role : ""}
      />
      <TicketEstimateDialog
        open={Boolean(selectedEstimateTicket)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEstimateTicket(null)
          }
        }}
        ticket={selectedEstimateTicket as TicketEstimateData}
        currentUserRole={typeof auth.user?.role === 'string' ? auth.user.role : ''}
        currentUserId={currentUserId}
        onUpdated={(updatedTicket) => {
          const typedTicket = updatedTicket as Ticket
          setTickets((prevTickets) =>
            prevTickets.map((ticket) => (ticket.id === typedTicket.id ? typedTicket : ticket)),
          )
          setSelectedEstimateTicket(typedTicket)
        }}
      />
    </AdminITLayout>
  )
}
