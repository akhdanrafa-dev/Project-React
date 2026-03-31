import { Head, usePage } from '@inertiajs/react'
import { AlertCircle, Clock, CheckCircle2, XCircle, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import AdminITLayout from '@/layouts/app/AdminITLayout'
import { TicketEstimateData } from '@/lib/ticket-estimate'
import {
  getPendingEstimateDeadline,
  getPendingEstimateRemainingLabel,
  getTicketStatusLabel,
  normalizeTicketStatus,
  TICKET_STATUS,
} from '@/lib/ticket-status'
import { formatTicketCompletedAt, formatTicketLocalDateTime } from '@/lib/ticket-timing'
import type { SharedData } from '@/types'

interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  created_at: string
  taken_at?: string | null
  updated_at?: string | null
  resolved_at?: string | null
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
  user: {
    id: number
    name: string
    email: string
  }
  assigned_to: number | null
  collaboration_type?: string
  collaborators?: number[] | null
}

export default function AdminITTickets() {
  const { auth } = usePage<SharedData>().props
  const currentUserId = auth?.user?.id ?? 0
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('open')
  const [selectedEstimateTicket, setSelectedEstimateTicket] = useState<Ticket | null>(null)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchTickets = async (isSilent = false) => {
      try {
        if (!isSilent) {
          setLoading(true)
        }
        const response = await fetch('/api/bug-tickets', {
          cache: 'no-store',
        })
        if (!response.ok) throw new Error('Failed to fetch tickets')
        const data = await response.json()
        if (isMounted) {
          setTickets(data)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        if (isMounted && !isSilent) {
          setLoading(false)
        }
      }
    }

    fetchTickets()

    const interval = setInterval(() => {
      fetchTickets(true)
    }, 15000)

    const handleFocus = () => {
      fetchTickets(true)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
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

  useEffect(() => {
    let filtered = tickets

    if (activeTab === 'open') {
      filtered = filtered.filter(
        (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.OPEN,
      )
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(
        (ticket) =>
          normalizeTicketStatus(ticket.status) === TICKET_STATUS.PENDING_ESTIMATE,
      )
    } else if (activeTab === 'progress') {
      filtered = filtered.filter(
        (ticket) =>
          normalizeTicketStatus(ticket.status) === TICKET_STATUS.IN_PROGRESS,
      )
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter(
        (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.RESOLVED,
      )
    } else if (activeTab === 'closed') {
      filtered = filtered.filter(
        (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.CLOSED,
      )
    }

    if (searchTerm) {
      filtered = filtered.filter(
        t =>
          t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredTickets(filtered)
  }, [tickets, activeTab, searchTerm])

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
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    return getTicketStatusLabel(status)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />
      case 'pending_estimate':
        return <Clock className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4" />
      case 'closed':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const isCurrentAdminCollaborator = (ticket: Ticket) => {
    if (!currentUserId) return false
    if (ticket.assigned_to === currentUserId) return false
    if (ticket.collaboration_type !== 'collab') return false
    if (!Array.isArray(ticket.collaborators)) return false

    return ticket.collaborators.map(Number).includes(Number(currentUserId))
  }

  const openTickets = tickets.filter(
    (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.OPEN,
  )
  const pendingEstimateTickets = tickets.filter(
    (ticket) =>
      normalizeTicketStatus(ticket.status) === TICKET_STATUS.PENDING_ESTIMATE,
  )
  const inProgressTickets = tickets.filter(
    (ticket) =>
      normalizeTicketStatus(ticket.status) === TICKET_STATUS.IN_PROGRESS,
  )
  const resolvedTickets = tickets.filter(
    (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.RESOLVED,
  )
  const closedTickets = tickets.filter(
    (ticket) => normalizeTicketStatus(ticket.status) === TICKET_STATUS.CLOSED,
  )
  const TicketTable = ({ data }: { data: Ticket[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomor Tiket</TableHead>
            <TableHead>Judul</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Prioritas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pengguna</TableHead>
            <TableHead>Waktu Masuk</TableHead>
            <TableHead>Waktu Selesai</TableHead>
            <TableHead>Estimasi</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Tidak ada tiket
              </TableCell>
            </TableRow>
          ) : (
            data.map(ticket => (
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${getStatusColor(ticket.status)} flex w-fit gap-2`}>
                      {getStatusIcon(ticket.status)}
                      {getStatusLabel(ticket.status)}
                    </Badge>
                    {isCurrentAdminCollaborator(ticket) && (
                      <Badge variant="outline" className="border-cyan-300 bg-cyan-50 text-cyan-700">
                        Collab
                      </Badge>
                    )}
                  </div>
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
                <TableCell className="text-sm text-muted-foreground">
                  {formatTicketCompletedAt(ticket)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {ticket.estimated_completion_at
                        ? formatTicketLocalDateTime(ticket.estimated_completion_at)
                        : 'Belum diatur'}
                    </p>
                    {normalizeTicketStatus(ticket.status) === TICKET_STATUS.PENDING_ESTIMATE ? (
                      <p className="text-xs text-muted-foreground">
                        Batas atur estimasi:{' '}
                        {formatTicketLocalDateTime(getPendingEstimateDeadline(ticket))}{' '}
                        ({getPendingEstimateRemainingLabel(ticket) ?? '-'})
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {normalizeTicketStatus(ticket.status) ===
                    TICKET_STATUS.PENDING_ESTIMATE &&
                  ticket.assigned_to === currentUserId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEstimateTicket(ticket)}
                    >
                      Atur Estimasi
                    </Button>
                  ) : normalizeTicketStatus(ticket.status) !== TICKET_STATUS.CLOSED ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/admin-it/ticket/${ticket.id}`
                      }}
                    >
                      Buka
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Ditutup</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
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
      <div className="space-y-4 p-4 md:p-6">
        <Head title="Laporan Tiket" />

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Tiket</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lihat dan kelola semua tiket laporan dari pengguna
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {unreadNotificationCount > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base text-amber-900">
                Notifikasi Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-amber-900">
                Anda mendapat notifikasi baru. {unreadNotificationCount} notifikasi
                tiket belum dibaca.
              </p>
              <Button asChild type="button" variant="outline">
                <a href="/admin-it/notifications">Buka riwayat notifikasi</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
              <Input
                placeholder="Cari tiket berdasarkan nomor, judul, atau nama pengguna..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terbuka</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {openTickets.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Estimasi Pengerjaan</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingEstimateTickets.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sedang Diproses</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inProgressTickets.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resolvedTickets.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditutup</CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {closedTickets.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Tiket</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="open">
                  Terbuka ({openTickets.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Menunggu Estimasi Pengerjaan ({pendingEstimateTickets.length})
                </TabsTrigger>
                <TabsTrigger value="progress">
                  Sedang Diproses ({inProgressTickets.length})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Menunggu Verifikasi ({resolvedTickets.length})
                </TabsTrigger>
                <TabsTrigger value="closed">
                  Ditutup ({closedTickets.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="mt-6">
                <TicketTable data={filteredTickets} />
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <TicketTable data={filteredTickets} />
              </TabsContent>

              <TabsContent value="progress" className="mt-6">
                <TicketTable data={filteredTickets} />
              </TabsContent>

              <TabsContent value="resolved" className="mt-6">
                <TicketTable data={filteredTickets} />
              </TabsContent>

              <TabsContent value="closed" className="mt-6">
                <TicketTable data={filteredTickets} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <TicketEstimateDialog
        open={Boolean(selectedEstimateTicket)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEstimateTicket(null)
          }
        }}
        ticket={selectedEstimateTicket as TicketEstimateData}
        currentUserRole={typeof auth?.user?.role === 'string' ? auth.user.role : ''}
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
