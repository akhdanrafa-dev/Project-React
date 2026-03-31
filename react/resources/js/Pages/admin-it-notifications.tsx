import { Head } from '@inertiajs/react'
import { Bell, CheckCheck, Clock3, ExternalLink, History } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar-trigger'
import AdminITLayout from '@/layouts/app/AdminITLayout'
import { fetchWithCsrfRetry } from '@/lib/csrf'
import { formatTicketLocalDateTime } from '@/lib/ticket-timing'

interface NotificationTicket {
  id: number
  ticket_number: string
  title: string
  status: string
  url: string
}

interface NotificationItem {
  id: number
  type: string
  type_label: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  read_at?: string | null
  payload?: {
    deadline_at?: string | null
  } | null
  ticket?: NotificationTicket | null
}

export default function AdminItNotifications() {
  const [unreadNotifications, setUnreadNotifications] = useState<NotificationItem[]>([])
  const [historyNotifications, setHistoryNotifications] = useState<NotificationItem[]>([])
  const [activeTab, setActiveTab] = useState<'unread' | 'history'>('unread')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingState, setSubmittingState] = useState<number | 'all' | null>(null)

  const fetchNotifications = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true)
      }

      const response = await fetch('/api/admin-it/notifications', {
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch notifications' }))
        throw new Error(errorData.message || 'Failed to fetch notifications')
      }

      const data = await response.json()
      setUnreadNotifications(data.unread_notifications || [])
      setHistoryNotifications(data.history_notifications || [])
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memuat notifikasi.',
      )
    } finally {
      if (!isSilent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 15000)

    const handleFocus = () => {
      fetchNotifications(true)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setSubmittingState(notificationId)

      const response = await fetchWithCsrfRetry(
        `/api/admin-it/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to update notification' }))
        throw new Error(errorData.message || 'Failed to update notification')
      }

      await fetchNotifications(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memperbarui notifikasi.',
      )
    } finally {
      setSubmittingState(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setSubmittingState('all')

      const response = await fetchWithCsrfRetry(
        '/api/admin-it/notifications/read-all',
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to update notifications' }))
        throw new Error(errorData.message || 'Failed to update notifications')
      }

      await fetchNotifications(true)
      setActiveTab('history')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menandai semua notifikasi.',
      )
    } finally {
      setSubmittingState(null)
    }
  }

  const displayNotifications =
    activeTab === 'unread' ? unreadNotifications : historyNotifications

  return (
    <AdminITLayout>
      <Head title="Notifikasi" />

      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin-it-dashboard">Admin IT Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin-it/notifications">Notifikasi</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kelola notifikasi tiket yang masuk ke akun Admin IT.
            </p>
          </div>

          {unreadNotifications.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={submittingState === 'all'}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Tandai semua dibaca
            </Button>
          )}
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2 border-b pb-2">
          <Button
            type="button"
            variant={activeTab === 'unread' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('unread')}
          >
            <Bell className="mr-2 h-4 w-4" />
            Belum dibaca ({unreadNotifications.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
          >
            <History className="mr-2 h-4 w-4" />
            Semua ({unreadNotifications.length + historyNotifications.length})
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Memuat notifikasi...</p>
            </CardContent>
          </Card>
        ) : displayNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                {activeTab === 'unread'
                  ? 'Belum ada notifikasi baru.'
                  : 'Belum ada notifikasi tersimpan.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayNotifications.map((notification) => (
              <Card key={notification.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Bell className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <Badge variant="outline">{notification.type_label}</Badge>
                        {!notification.is_read && (
                          <Badge className="bg-amber-100 text-amber-800">Baru</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Masuk:{' '}
                        {formatTicketLocalDateTime(notification.created_at) ?? '-'}
                        {notification.read_at
                          ? ` - Dibaca ${formatTicketLocalDateTime(notification.read_at) ?? '-'}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-4">
                    <p className="text-sm text-amber-950">{notification.message}</p>
                  </div>

                  {notification.payload?.deadline_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      <span>
                        Batas atur estimasi:{' '}
                        {formatTicketLocalDateTime(notification.payload.deadline_at) ?? '-'}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                      {notification.ticket
                        ? `${notification.ticket.ticket_number} - ${notification.ticket.title}`
                        : 'Tiket terkait sudah tidak tersedia.'}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {notification.ticket?.url && (
                        <Button asChild variant="outline" size="sm">
                          <a href={notification.ticket.url}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Buka tiket
                          </a>
                        </Button>
                      )}

                      {!notification.is_read && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={submittingState === notification.id}
                        >
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Tandai dibaca
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminITLayout>
  )
}
