import { Head, router } from "@inertiajs/react"
import { useEffect, useMemo, useState } from "react"

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
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import RootLayout from "@/layouts/app/RootLayouts"

interface Developer {
  id: number
  name: string
  email?: string
  role?: string
  is_active?: boolean
  last_seen?: string
}

export default function StaffDeveloperManagement() {
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchDevelopers = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/developers')
        if (!res.ok) throw new Error('Gagal memuat developer')
        const data = await res.json()
        if (!mounted) return
        setDevelopers(data.users || [])
      } catch (error) {
        console.error('Failed to fetch developers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopers()
    return () => { mounted = false }
  }, [])

  const selectedDeveloper = useMemo(
    () => developers.find((d) => d.id === selectedDeveloperId) ?? null,
    [developers, selectedDeveloperId],
  )

  const handleChatClick = (developerId: number) => {
    router.get(`/staff/chat/${developerId}`)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <RootLayout hideFloatingChat>
      <Head title="Manajemen Developer" />

      {/* Header with breadcrumbs */}
      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/staff-dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/staff/developer-management">Manajemen Developer</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Page title and description */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Developer</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilih developer untuk memulai obrolan dan pantau status aktivitas mereka.
          </p>
        </div>

        {/* List card */}
        <div className="grid gap-4 lg:grid-cols-[1fr]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Daftar Developer</CardTitle>
              <CardDescription>Aktif, tidak aktif, dan terakhir dilihat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && (
                <p className="text-sm text-muted-foreground">Memuat developer...</p>
              )}
              {!loading && developers.length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada developer.</p>
              )}

              {!loading && developers.map((dev) => {
                const isSelected = dev.id === selectedDeveloperId
                const isActive = !!dev.is_active
                return (
                  <div
                    key={dev.id}
                    className={`rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-50/5' : 'border-border'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDeveloperId(dev.id)}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-semibold">
                          {getInitials(dev.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{dev.name}</p>
                          <Badge variant={isActive ? 'default' : 'secondary'}>
                            {isActive ? 'Aktif' : 'Tidak aktif'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{dev.role ?? 'developer'}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span>{isActive ? 'Aktif sekarang' : `Dilihat ${dev.last_seen ?? '-'}`}</span>
                        </div>
                      </div>
                    </button>
                    <div className="flex justify-end gap-2 border-t p-2">
                      <Button size="sm" variant="secondary" onClick={() => handleChatClick(dev.id)}>
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
