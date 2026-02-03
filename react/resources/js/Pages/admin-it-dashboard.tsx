import { Head, usePage } from '@inertiajs/react'
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { BugReportChat } from '@/components/bug-report-chat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AdminITLayout from '@/layouts/app/AdminITLayout'
import type { SharedData } from '@/types'

interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  difficulty_level: string
  category: string
  created_at: string
  user: {
    id: number
    name: string
    email: string
  }
  assigned_to: number | null
}

interface Stats {
  total_open: number
  total_in_progress: number
  total_resolved: number
  total_closed: number
}

export default function AdminITDashboard() {
  const { auth } = usePage<SharedData>().props
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats>({
    total_open: 0,
    total_in_progress: 0,
    total_resolved: 0,
    total_closed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const currentUserId = auth.user?.id ?? 0

  const openTicketChat = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setChatOpen(true)
  }

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/bug-tickets')
        if (!response.ok) throw new Error('Failed to fetch tickets')
        const data = await response.json()
        setTickets(data)

        const statsData = {
          total_open: data.filter((t: Ticket) => t.status === 'open').length,
          total_in_progress: data.filter((t: Ticket) => t.status === 'in_progress').length,
          total_resolved: data.filter((t: Ticket) => t.status === 'resolved').length,
          total_closed: data.filter((t: Ticket) => t.status === 'closed').length,
        }
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const handleTakeTicket = async (ticketId: number) => {
    try {
      const userId = auth.user?.id
      if (!userId) {
        setError('User ID tidak ditemukan. Silakan refresh halaman.')
        return
      }

      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')

      const response = await fetch(`/api/bug-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          assigned_to: userId,
          status: 'in_progress',
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to take ticket (${response.status})`)
      }
      const updatedTicket = await response.json()
      setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t))
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
      case 'in_progress':
        return 'Dalam Proses'
      case 'resolved':
        return 'Terselesaikan'
      case 'diproses kembali':
        return 'Diproses Kembali'
      case 'closed':
        return 'Ditutup'
      default:
        return status
    }
  }

  const getDifficultyColor = (difficulty: string) => {
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
      <div className="space-y-4 p-4 md:p-6">
        <Head title="Admin IT Dashboard" />

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiket Terbuka</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_open}</div>
              <p className="text-xs text-muted-foreground">Menunggu penugasan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_in_progress}</div>
              <p className="text-xs text-muted-foreground">Sedang ditangani</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terselesaikan</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_resolved}</div>
              <p className="text-xs text-muted-foreground">Masalah terpecahkan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditutup</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_closed}</div>
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
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets
                    .filter(ticket => ticket.status === 'open')
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
                            {ticket.difficulty_level === 'easy' ? 'Mudah' : ticket.difficulty_level === 'medium' ? 'Sedang' : 'Sulit'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status === 'open' ? 'Terbuka' : ticket.status}
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
                          {new Date(ticket.created_at).toLocaleDateString('id-ID')}
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
              {tickets.filter(t => t.status === 'open').length === 0 && (
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
            <CardTitle>Tiket Saya yang Sedang Diproses</CardTitle>
            <CardDescription>
              Daftar tiket yang sedang Anda tangani
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
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets
                    .filter(ticket => ticket.status === 'in_progress' && ticket.assigned_to)
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
                            {ticket.difficulty_level === 'easy' ? 'Mudah' : ticket.difficulty_level === 'medium' ? 'Sedang' : 'Sulit'}
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
                          {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => openTicketChat(ticket)}
                          >
                            Buka Chat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {tickets.filter(t => t.status === 'in_progress' && t.assigned_to).length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Tidak ada tiket yang sedang diproses</p>
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
                            {ticket.difficulty_level === 'easy' ? 'Mudah' : ticket.difficulty_level === 'medium' ? 'Sedang' : 'Sulit'}
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
      />
    </AdminITLayout>
  )
}
