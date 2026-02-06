import { Head, usePage } from "@inertiajs/react"
import { ArrowLeft } from "lucide-react"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import RootLayout from "@/layouts/app/RootLayouts"

interface PageProps { staffId: number }

interface StaffMember {
  id: number
  name: string
  role: string
  is_active?: boolean
  last_seen?: string
}

interface ChatMessageUI {
  id: number
  sender: "developer" | "staff"
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

export default function DeveloperStaffChat() {
  const { props } = usePage<{ staffId: number }>()
  const staffId = (props as unknown as PageProps).staffId

  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessageUI[]>([])
  const [text, setText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    const loadStaffAndMessages = async () => {
      try {
        setLoading(true)

        const staffRes = await fetch('/api/staff-users')
        const staffData = await staffRes.json()
        const match = staffData.users.find((u: StaffMember) => u.id === Number(staffId))

        if (mounted && match) {
          setStaff({
            id: match.id,
            name: match.name ?? match.username ?? `User ${match.id}`,
            role: match.role ?? 'staff',
            is_active: !!match.is_active,
            last_seen: match.last_seen ?? '-',
          })
        }

        const messagesRes = await fetch(`/api/staff-developer-chats/${staffId}/messages`)
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

    if (staffId) {
      loadStaffAndMessages()
    }

    return () => {
      mounted = false
    }
  }, [staffId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !staff) return

    setIsSending(true)
    const messageText = text.trim()

    try {
      const csrfToken = getCsrfToken()
      
      if (!csrfToken) {
        throw new Error('CSRF token not found. Please refresh the page.')
      }

      const response = await fetch(
        `/api/staff-developer-chats/${staff.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
          },
          body: JSON.stringify({ message: messageText }),
        }
      )

      const newCsrfToken = response.headers.get('x-csrf-token')
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
          sender: 'developer',
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
    if (!staff) return

    if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat obrolan? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    try {
      const csrfToken = getCsrfToken()
      
      if (!csrfToken) {
        throw new Error('CSRF token not found. Please refresh the page.')
      }

      const response = await fetch(
        `/api/staff-developer-chats/${staff.id}/messages?viewer=developer`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-TOKEN': csrfToken,
          },
        }
      )

      const newCsrfToken = response.headers.get('x-csrf-token')
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

  const handleExitChat = () => {
    window.location.href = '/developer/debug'
  }

  const initials = useMemo(() => {
    if (!staff) return "US"
    return staff.name
      .split(' ')
      .map((w) => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [staff])

  return (
    <RootLayout hideFloatingChat>
      <Head title={`Obrolan Staff #${staffId}`} />

      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitChat}
            className="gap-2"
            title="Keluar dari obrolan"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>
          <Separator orientation="vertical" className="h-4" />
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {loading ? 'Memuat...' : staff ? staff.name : `Staff #${staffId}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${staff?.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>{staff?.is_active ? 'Aktif sekarang' : `Dilihat ${staff?.last_seen ?? '-'}`}</span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {staff && (
            <Badge variant={staff.is_active ? 'default' : 'secondary'}>
              {staff.is_active ? 'Aktif' : 'Tidak aktif'}
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
              Mulai percakapan Anda dengan staff.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.sender === 'developer' ? 'justify-end' : 'justify-start'}`}>
                {m.sender === 'staff' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className="max-w-[75%] space-y-1">
                  <p className="text-xs text-muted-foreground">{m.sender === 'developer' ? 'Anda' : staff?.name ?? 'Staff'}</p>
                  <div className={`rounded-lg px-3 py-2 ${m.sender === 'developer' ? 'bg-blue-600 text-white' : 'border bg-white dark:bg-slate-800 text-foreground'}`}>
                    {m.message}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.time}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t p-4 space-y-3 bg-background">
          <Input
            placeholder={`Tulis pesan ke ${staff?.name ?? 'staff'}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!staff || isSending}
            className="dark:bg-slate-800 dark:text-white"
          />
          <Button type="submit" disabled={!staff || !text.trim() || isSending}>
            {isSending ? 'Mengirim...' : 'Kirim'}
          </Button>
        </form>
      </div>
    </RootLayout>
  )
}
