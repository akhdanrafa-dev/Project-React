import { Head } from "@inertiajs/react"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import RootLayout from "@/layouts/app/RootLayouts"
import {
  initialStaffConversations,
  type StaffChatMessage,
} from "@/lib/staff-conversations"

type StaffStatus = "active" | "inactive"

interface StaffMember {
  id: number
  name: string
  role: string
  status: StaffStatus
  lastSeen: string
}

// akan diisi dari API
const staffMembers: StaffMember[] = []


export default function DeveloperStaffManagement() {
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [conversations, setConversations] = useState<Record<number, StaffChatMessage[]>>(
    () => initialStaffConversations,
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    async function loadStaff() {
      try {
        setLoading(true)
        const res = await fetch('/api/staff-users')
        if (!res.ok) throw new Error('Gagal memuat staff')
        const data = await res.json()
        const rawUsers = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : Array.isArray(data?.data)
              ? data.data
              : []
        // map API -> StaffMember
        const mapped: StaffMember[] = rawUsers
          .filter((u: any) => String(u?.role ?? 'staff').toLowerCase() === 'staff')
          .map((u: any) => {
            const statusValue = typeof u?.status === 'string' ? u.status.toLowerCase() : ''
            const status: StaffStatus =
              statusValue === 'active' || statusValue === 'inactive'
                ? (statusValue as StaffStatus)
                : u?.is_active === false
                  ? 'inactive'
                  : 'active'

            return {
              id: u.id,
              name: u.name ?? u.username ?? `User ${u.id}`,
              role: u.role ?? 'staff',
              status,
              lastSeen: u.lastSeen ?? u.last_seen ?? '-',
            }
          })
        if (isMounted) setStaff(mapped)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadStaff()
    return () => {
      isMounted = false
    }
  }, [])

  const selectedStaff = useMemo(
    () => staff.find((s) => s.id === selectedStaffId) ?? null,
    [selectedStaffId, staff],
  )

  const selectedMessages = selectedStaffId ? conversations[selectedStaffId] ?? [] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedStaffId, selectedMessages.length])

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedStaffId || !message.trim()) return

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

      const response = await fetch(`/api/staff-developer-chats/${selectedStaffId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const newMessage = await response.json()

      // Update local conversations
      setConversations((prev) => ({
        ...prev,
        [selectedStaffId]: [...(prev[selectedStaffId] ?? []), {
          id: newMessage.id,
          sender: "developer",
          message: newMessage.message,
          created_at: newMessage.created_at,
        }],
      }))

      setMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      // You might want to show a toast notification here
    }
  }

  const goToFullChat = (staffId: number) => {
    window.location.href = `/developer/chat/${staffId}`
  }

  return (
    <RootLayout hideFloatingChat>
      <Head title="Manajemen Staff" />

      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/developer-dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/developer/debug">Manajemen Staff</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Staff</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilih staff untuk memulai obrolan dan pantau status aktivitas mereka.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Daftar Staff</CardTitle>
              <CardDescription>Aktif, tidak aktif, dan terakhir dilihat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && (
                <p className="text-sm text-muted-foreground">Memuat staff...</p>
              )}
              {!loading && staff.length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada staff.</p>
              )}
              {!loading && staff.map((s) => {
                const isSelected = s.id === selectedStaffId
                const isActive = s.status === "active"
                return (
                  <div key={s.id} className={`rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-border'}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedStaffId(s.id)}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-semibold">
                          {s.name
                            .split(" ")
                            .map((word) => word.charAt(0))
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{s.name}</p>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Aktif" : "Tidak aktif"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.role}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span>{isActive ? 'Aktif sekarang' : `Dilihat ${s.lastSeen}`}</span>
                        </div>
                      </div>
                    </button>
                    <div className="flex justify-end gap-2 border-t p-2">
                      <Button size="sm" variant="secondary" onClick={() => goToFullChat(s.id)}>
                        Buka Obrolan Penuh
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </RootLayout>
  )
}
