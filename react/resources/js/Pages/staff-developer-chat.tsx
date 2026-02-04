import { Head, usePage } from "@inertiajs/react"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import RootLayout from "@/layouts/app/RootLayouts"

interface PageProps {
  developerId: number
}

interface Developer {
  id: number
  name: string
  role: string
  is_active?: boolean
  last_seen?: string
}

interface ChatMessageUI {
  id: number
  sender: 'staff' | 'developer'
  message: string
  time: string
}

const getCsrfToken = (): string => {
  const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content') || ''
  return token
}

const updateCsrfToken = (newToken: string): void => {
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  if (metaTag && newToken) {
    metaTag.setAttribute('content', newToken)
  }
}

const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()!.split(';').shift() || ''
  }
  return ''
}

const getXsrfTokenFromCookie = (): string => {
  // Laravel sets XSRF-TOKEN cookie URL-encoded
  const raw = getCookie('XSRF-TOKEN')
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

const ensureCsrfCookie = async (): Promise<void> => {
  // Refresh CSRF cookie used by Laravel/Sanctum to validate X-XSRF-TOKEN
  await fetch('/sanctum/csrf-cookie', {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
}

export default function StaffDeveloperChat() {
  const { props } = usePage<{ developerId: number }>()
  const developerId = (props as unknown as PageProps).developerId

  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessageUI[]>([])
  const [text, setText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    const loadDeveloperAndMessages = async () => {
      try {
        setLoading(true)

        const developerRes = await fetch('/api/developers', {
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
        const developerData = await developerRes.json()
        const match = developerData.users.find((u: Developer) => u.id === Number(developerId))

        if (mounted && match) {
          setDeveloper({
            id: match.id,
            name: match.name ?? match.username ?? `User ${match.id}`,
            role: match.role ?? 'developer',
            is_active: !!match.is_active,
            last_seen: match.last_seen ?? '-',
          })
        }

        const messagesRes = await fetch(`/api/staff-developer-chats/${developerId}/messages`, {
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          if (mounted) {
            const formattedMessages = (messagesData.messages || []).map((msg: ChatMessageUI & { created_at?: string }) => ({
              ...msg,
              time: msg.created_at 
                ? new Date(msg.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : msg.time,
            }))
            setMessages(formattedMessages)
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (developerId) {
      loadDeveloperAndMessages()
    }

    return () => {
      mounted = false
    }
  }, [developerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !developer) return

    setIsSending(true)
    const messageText = text.trim()

    try {
      // Ensure CSRF cookie + send X-XSRF-TOKEN from cookie (Laravel/Sanctum compatible)
      await ensureCsrfCookie()

      const csrfToken = getCsrfToken()
      const xsrfToken = getXsrfTokenFromCookie()

      if (!csrfToken && !xsrfToken) {
        throw new Error('CSRF token not found. Please refresh the page.')
      }

      const response = await fetch(
        `/api/staff-developer-chats/${developer.id}/messages`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            // Prefer X-XSRF-TOKEN (cookie-based). Keep X-CSRF-TOKEN as fallback for non-sanctum routes.
            ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ message: messageText }),
        }
      )

      // Backend middleware sends `X-CSRF-Token`
      const newCsrfToken =
        response.headers.get('X-CSRF-Token') || response.headers.get('x-csrf-token')
      if (newCsrfToken) {
        updateCsrfToken(newCsrfToken)
      }

      let responseData: any
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        const text = await response.text()
        console.error('Server returned non-JSON response:', text.substring(0, 200))
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      if (response.ok) {
        const createdAt = new Date(responseData.created_at)
        const msg: ChatMessageUI = {
          id: responseData.id,
          sender: 'staff',
          message: messageText,
          time: createdAt.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }
        setMessages((prev) => [...prev, msg])
        setText("")
      } else {
        console.error('Failed to send message:', responseData)
        alert(`Error: ${responseData.message || 'Failed to send message'}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteHistory = async () => {
    if (!developer) return

    if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat obrolan? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    try {
      await ensureCsrfCookie()

      const csrfToken = getCsrfToken()
      const xsrfToken = getXsrfTokenFromCookie()

      if (!csrfToken && !xsrfToken) {
        throw new Error('CSRF token not found. Please refresh the page.')
      }

      const response = await fetch(
        `/api/staff-developer-chats/${developer.id}/messages`,
        {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      )

      const newCsrfToken =
        response.headers.get('X-CSRF-Token') || response.headers.get('x-csrf-token')
      if (newCsrfToken) {
        updateCsrfToken(newCsrfToken)
      }

      if (response.ok) {
        setMessages([])
      } else {
        console.error('Failed to delete history')
      }
    } catch (error) {
      console.error('Error deleting history:', error)
    }
  }

  const initials = useMemo(() => {
    if (!developer) return 'US'
    return developer.name
      .split(' ')
      .map((w) => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [developer])

  return (
    <RootLayout hideFloatingChat>
      <Head title={`Obrolan Developer #${developerId}`} />

      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {loading ? 'Memuat...' : developer ? developer.name : `Developer #${developerId}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${developer?.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>
                {developer?.is_active ? 'Aktif sekarang' : `Dilihat ${developer?.last_seen ?? '-'}`}
              </span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {developer && (
            <Badge variant={developer.is_active ? 'default' : 'secondary'}>
              {developer.is_active ? 'Aktif' : 'Tidak aktif'}
            </Badge>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteHistory}
            disabled={messages.length === 0}
          >
            Hapus Riwayat
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex-1 overflow-y-auto bg-muted/30 p-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Mulai percakapan Anda dengan developer.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'staff' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'developer' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className="max-w-[75%] space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {m.sender === 'staff' ? 'Anda' : developer?.name ?? 'Developer'}
                  </p>
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      m.sender === 'staff'
                        ? 'bg-blue-600 text-white'
                        : 'border bg-white text-foreground'
                    }`}
                  >
                    {m.message}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.time}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t p-4 space-y-3">
          <Input
            placeholder={`Tulis pesan ke ${developer?.name ?? 'developer'}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!developer || isSending}
          />
          <Button type="submit" disabled={!developer || !text.trim() || isSending}>
            {isSending ? 'Mengirim...' : 'Kirim'}
          </Button>
        </form>
      </div>
    </RootLayout>
  )
}
