import { Head, usePage } from '@inertiajs/react'
import { Send, ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

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
  assigned_admin?: {
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

interface Props {
  ticketId: number
}

const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}

export default function AdminITChat({ ticketId }: Props) {
  const { auth } = usePage<SharedData>().props
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserId = auth.user?.id || 0

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  useEffect(() => {
    scrollToBottom()
  }, [ticket?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/bug-tickets/${ticketId}`)
      if (!response.ok) throw new Error('Failed to fetch ticket')
      const data = await response.json()
      setTicket(data)
      await markMessagesAsRead()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await fetch(`/api/bug-tickets/${ticketId}/messages/mark-all-as-read`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-Token': getCsrfToken(),
        },
      })
    } catch (err) {
      console.error('Failed to mark messages as read:', err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/bug-tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (!response.ok) throw new Error('Failed to send message')
      setMessage('')
      await fetchTicket()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleResolveTicket = async () => {
    if (!ticket) return
    try {
      const response = await fetch(`/api/bug-tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({
          status: 'resolved',
        }),
      })
      if (!response.ok) throw new Error('Failed to resolve ticket')
      await fetchTicket()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve ticket')
    }
  }

  const handleCloseTicket = async () => {
    if (!ticket) return
    try {
      const response = await fetch(`/api/bug-tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({
          status: 'closed',
        }),
      })
      if (!response.ok) throw new Error('Failed to close ticket')
      await fetchTicket()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close ticket')
    }
  }

  const handleTakeTicket = async () => {
    if (!ticket || !currentUserId) return

    try {
      const response = await fetch(`/api/bug-tickets/${ticket.id}/take`, {
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
      await fetchTicket()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
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
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
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

  if (!ticket) {
    return (
      <AdminITLayout>
        <div className="p-6">
          <div>Tiket tidak ditemukan</div>
        </div>
      </AdminITLayout>
    )
  }

  const assignedAdminName =
    ticket.assignedAdmin?.name ??
    ticket.assigned_admin?.name ??
    (ticket.assigned_to === currentUserId ? auth.user?.name ?? null : null)

  return (
    <AdminITLayout>
      <div className="space-y-4 p-4 md:p-6">
        <Head title={`Chat - ${ticket.ticket_number}`} />

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{ticket.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {ticket.ticket_number} • {ticket.user.name}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status === 'in_progress' ? 'Dalam Proses' : ticket.status}
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {ticket.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Tidak ada pesan
                  </div>
                ) : (
                  <>
                    {ticket.messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.user_id === currentUserId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.user_id === currentUserId
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">{msg.user.name}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.user_id === currentUserId
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Ketik pesan..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    disabled={sending || ['resolved', 'closed'].includes(ticket.status)}
                  />
                  <Button
                    type="submit"
                    disabled={
                      sending || !message.trim() || ['resolved', 'closed'].includes(ticket.status)
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Ticket Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Tiket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Tiket</p>
                  <p className="font-mono text-sm font-medium">{ticket.ticket_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kategori</p>
                  <Badge variant="outline" className="capitalize">
                    {ticket.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prioritas</p>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tingkat Kesulitan</p>
                  <Badge className={getDifficultyColor(ticket.difficulty_level || 'medium')}>
                    {ticket.difficulty_level || 'medium'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status === 'in_progress' ? 'Dalam Proses' : ticket.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pengguna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{ticket.user.name}</p>
                  <p className="text-sm text-muted-foreground">{ticket.user.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Handle By</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedAdminName ? (
                  <p className="text-sm font-medium text-green-600">
                    {`Sudah di handle oleh (${assignedAdminName})`}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum di-handle</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </CardContent>
            </Card>

            {ticket.status === 'open' && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleTakeTicket}
              >
                Ambil Tiket
              </Button>
            )}

            {ticket.status === 'in_progress' && (
              <div className="space-y-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleResolveTicket}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tandai Terselesaikan
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCloseTicket}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Tutup Tiket
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminITLayout>
  )
}
