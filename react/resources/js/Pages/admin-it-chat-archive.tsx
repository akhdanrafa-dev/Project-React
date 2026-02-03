import { Head, usePage } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AdminITLayout from '@/layouts/app/AdminITLayout'
import type { SharedData } from '@/types'

const ARCHIVED_STATUSES = ['closed']

interface ChatMessage {
  id: number
  user_id: number
  message: string
  created_at: string
  user: {
    id: number
    name: string
  }
}

interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  resolved_at?: string | null
  user: {
    id: number
    name: string
    email: string
  }
  messages: ChatMessage[]
}

export default function AdminITChatArchive() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchArchivedTickets()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedTicket?.messages])

  const fetchArchivedTickets = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/bug-tickets', {
        headers: {
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('Gagal mengambil tiket')

      const data: Ticket[] = await response.json()
      const archived = data.filter(ticket => ARCHIVED_STATUSES.includes(ticket.status))
      setTickets(archived)
      if (!selectedTicketId && archived.length > 0) {
        selectTicket(archived[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const selectTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId)
    fetchTicketDetails(ticketId)
  }

  const fetchTicketDetails = async (ticketId: number) => {
    setLoadingDetails(true)
    try {
      const response = await fetch(`/api/bug-tickets/${ticketId}`, {
        headers: {
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('Gagal mengambil detail tiket')
      const data = await response.json()
      setSelectedTicket(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoadingDetails(false)
    }
  }

  const renderTicketItem = (ticket: Ticket) => {
    return (
      <div
        key={ticket.id}
        className="cursor-pointer rounded-lg border p-3 transition hover:bg-gray-50"
        onClick={() => selectTicket(ticket.id)}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate">
            {ticket.ticket_number || '#'} • {ticket.title}
          </p>
          <Badge className={ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
            {ticket.status === 'resolved' ? 'Terselesaikan' : 'Ditutup'}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
          <Badge className={ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
            Prioritas: {ticket.priority}
          </Badge>
          <p>{ticket.user.name}</p>
        </div>
      </div>
    )
  }

  return (
    <AdminITLayout>
      <div className="space-y-4 p-4 md:p-6">
        <Head title="Arsip Chat" />

        <div className="flex items-center gap-3">
          <ArrowLeft className="h-5 w-5 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Arsip Chat Tiket</h1>
            <p className="text-sm text-muted-foreground">Lihat percakapan tiket yang sudah ditutup</p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-[320px,auto]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Tiket Ditutup</CardTitle>
              <CardDescription>Daftar chat yang sudah diarsipkan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Memuat arsip...</p>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada arsip</p>
              ) : (
                tickets.map(renderTicketItem)
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    {selectedTicket ? selectedTicket.title : 'Pilih tiket arsip untuk melihat chat'}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {selectedTicket ? `${selectedTicket.ticket_number} •` : 'Tidak ada tiket terpilih'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                  Kembali
                </Button>
              </div>
            </CardHeader>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {loadingDetails ? (
                  <p className="text-sm text-muted-foreground">Memuat chat...</p>
                ) : !selectedTicket ? (
                  <p className="text-sm text-muted-foreground text-center">Pilih arsip untuk membuka chat</p>
                ) : selectedTicket.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">Tidak ada pesan di arsip ini.</p>
                ) : (
                  selectedTicket.messages.map(msg => (
                    <div
                      key={msg.id}
                      className="flex gap-3"
                    >
                      <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-100">
                        <p className="text-xs font-medium text-muted-foreground">{msg.user.name}</p>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4">
                <p className="text-xs text-muted-foreground">
                  Percakapan ini sudah diarsipkan—tidak bisa membalas lagi.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminITLayout>
  )
}
