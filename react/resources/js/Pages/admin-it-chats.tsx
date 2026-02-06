import { Head, usePage } from '@inertiajs/react'
import { ArrowLeft, CheckCircle2, MessageSquare } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import AdminITLayout from '@/layouts/app/AdminITLayout'
import type { SharedData } from '@/types'

interface ChatMessage {
  id: number
  user_id: number
  message: string
  created_at: string
  user: {
    id: number
    name: string
    role: string
  }
  is_read: boolean
}

interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  difficulty_level?: string
  category: string
  created_at: string
  assigned_to?: number | null
  assignedAdmin?: {
    id: number
    name: string
  } | null
  user: {
    id: number
    name: string
    email: string
  }
  messages: ChatMessage[]
}

const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}

export default function AdminITChats() {
  const { auth } = usePage<SharedData>().props
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserId = auth.user?.id || 0

  useEffect(() => {
    fetchTickets()
    
    // Polling untuk update real-time setiap 5 detik
    const interval = setInterval(() => {
      fetchTickets()
    }, 5000) // 5 detik

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [selectedTicket?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTickets = async () => {
    setLoadingTickets(true)
    setError(null)
    try {
      const response = await fetch('/api/bug-tickets', {
        headers: {
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('Gagal mengambil tiket')

      const data = await response.json()
      setTickets(data)
      if (!selectedTicketId && data.length > 0) {
        selectTicket(data[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoadingTickets(false)
    }
  }

  const selectTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId)
    fetchTicketDetails(ticketId)
  }

  const fetchTicketDetails = async (ticketId: number) => {
    setLoadingTicketDetails(true)
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
      await fetch(`/api/bug-tickets/${ticketId}/messages/mark-all-as-read`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-Token': getCsrfToken(),
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoadingTicketDetails(false)
    }
  }

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() || !selectedTicketId || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/bug-tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ message: message.trim() }),
      })

      if (!response.ok) throw new Error('Gagal mengirim pesan')
      setMessage('')
      await fetchTicketDetails(selectedTicketId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSending(false)
    }
  }

  const handleTakeTicket = async () => {
    if (!selectedTicket || !currentUserId) return

    try {
      const ticketId = selectedTicket.id
      const response = await fetch(`/api/bug-tickets/${ticketId}/take`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ assigned_to: currentUserId }),
      })

      if (!response.ok) throw new Error('Gagal mengambil tiket')
      await fetchTicketDetails(ticketId)
      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: 'in_progress', assigned_to: currentUserId } : ticket,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleResolveTicket = async () => {
    if (!selectedTicket || selectedTicket.status !== 'in_progress') return

    try {
      const ticketId = selectedTicket.id
      const response = await fetch(`/api/bug-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ status: 'resolved' }),
      })

      if (!response.ok) throw new Error('Gagal mengubah status tiket')
      await fetchTicketDetails(ticketId)
      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: 'resolved' } : ticket,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
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
      case 'closed':
        return 'Ditutup'
      default:
        return status
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
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  return (
    <AdminITLayout>
      <div className="space-y-4 p-4 md:p-6">
        <Head title="Chat Tiket" />

        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chat Tiket</h1>
            <p className="text-sm text-muted-foreground">
              Komunikasikan progress tiket yang sedang Anda tangani
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

        <div className="grid gap-4 lg:grid-cols-[320px,auto]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Tiket Saya</CardTitle>
              <CardDescription>Daftar tiket yang bisa Anda chat-kan langsung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingTickets ? (
                <p className="text-sm text-muted-foreground">Memuat tiket...</p>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada tiket</p>
              ) : (
                tickets.map(ticket => {
                  const unread = (ticket.messages ?? []).filter(msg => !msg.is_read && msg.user_id !== currentUserId).length
                  const isSelected = ticket.id === selectedTicketId

                  return (
                    <div
                      key={ticket.id}
                      className={`cursor-pointer rounded-lg border p-3 transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-border hover:border-blue-400'
                        }`}
                      onClick={() => selectTicket(ticket.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">
                          {ticket.ticket_number || `#${ticket.id}`} • {ticket.title}
                        </p>
                        {unread > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          Prioritas: {ticket.priority}
                        </Badge>
                        <p>{ticket.user.name}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {selectedTicket ? selectedTicket.title : 'Pilih tiket untuk mulai chat'}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-1">
                    {selectedTicket?.ticket_number} • {selectedTicket?.user.name}
                    {selectedTicket && (
                      <div className="mt-2 text-xs">
                        {selectedTicket.assignedAdmin ? (
                          <span className="text-green-600">Handle By: {selectedTicket.assignedAdmin.name}</span>
                        ) : (
                          <span className="text-orange-600">Belum di-handle</span>
                        )}
                      </div>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="hidden sm:inline-flex"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </div>
            </CardHeader>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {loadingTicketDetails ? (
                  <p className="text-sm text-muted-foreground">Memuat chat...</p>
                ) : !selectedTicket ? (
                  <p className="text-sm text-muted-foreground text-center">
                    Pilih tiket untuk melihat chat.
                  </p>
                ) : selectedTicket.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    Belum ada pesan. Mulai percakapan dengan pengguna.
                  </p>
                ) : (
                  selectedTicket.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.user_id === currentUserId ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      {msg.user_id !== currentUserId && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                          {msg.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="max-w-[75%] space-y-1">
                        <p className="text-xs text-muted-foreground">{msg.user.name}</p>
                        <div
                          className={`rounded-lg px-3 py-2 ${msg.user_id === currentUserId ? 'bg-blue-600 text-white' : 'bg-white text-foreground border'
                            }`}
                        >
                          {msg.message}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="border-t p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {selectedTicket?.status === 'open'
                      ? 'Status: Terbuka'
                      : selectedTicket?.status === 'in_progress'
                        ? 'Status: Dalam Proses'
                        : selectedTicket
                          ? `Status: ${getStatusLabel(selectedTicket.status)}`
                          : 'Pilih tiket untuk mengirim pesan'}
                  </div>
                  <div className="flex gap-2">
                    {selectedTicket?.status === 'open' && (
                      <Button size="xs" variant="outline" type="button" onClick={handleTakeTicket}>
                        Ambil Tiket
                      </Button>
                    )}
                    {selectedTicket?.status === 'in_progress' && (
                      <Button size="xs" variant="ghost" type="button" onClick={handleResolveTicket}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Tandai Terselesaikan
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  placeholder="Tulis pesan..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={!selectedTicket}
                />
                <Button
                  type="submit"
                  disabled={!selectedTicket || sending || !message.trim()}
                >
                  Kirim
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </AdminITLayout>
  )
}
