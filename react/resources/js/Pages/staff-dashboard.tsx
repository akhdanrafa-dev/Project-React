import { Head, usePage } from '@inertiajs/react'
import {
  Package,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar-trigger'
import { useCatalog } from '@/layouts/app/context/CatalogContext'
import AppLayout from '@/layouts/app-layout'
import type { SharedData } from '@/types'

export default function StaffDashboard() {
  const { auth } = usePage<SharedData>().props
  const userName = auth.user?.name || 'Staff'

  return (
    <AppLayout>
      <Head title="Staff Dashboard" />
      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/staff-dashboard">Beranda</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <StaffDashboardContent userName={userName} />
    </AppLayout>
  )
}

function StaffDashboardContent({ userName }: { userName: string }) {
  const { products } = useCatalog()
  const [incomingMessages, setIncomingMessages] = useState(0)
  const [messagesLoading, setMessagesLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchIncomingMessages = async () => {
      try {
        setMessagesLoading(true)
        const developersRes = await fetch('/api/developers', {
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })

        if (!developersRes.ok) {
          throw new Error('Gagal memuat daftar developer')
        }

        const developersData = await developersRes.json()
        const developers = Array.isArray(developersData?.users)
          ? developersData.users
          : []

        const messageCounts = await Promise.all(
          developers.map(async (developer: { id: number }) => {
            try {
              const messagesRes = await fetch(
                `/api/staff-developer-chats/${developer.id}/messages`,
                {
                  credentials: 'same-origin',
                  headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                  },
                }
              )

              if (!messagesRes.ok) return 0

              const messagesData = await messagesRes.json()
              const messages = Array.isArray(messagesData?.messages)
                ? messagesData.messages
                : []

              return messages.filter(
                (message: { sender?: string }) => message.sender === 'developer'
              ).length
            } catch (error) {
              console.error('Error fetching developer messages:', error)
              return 0
            }
          })
        )

        if (!mounted) return

        const totalIncoming = messageCounts.reduce(
          (sum, count) => sum + count,
          0
        )
        setIncomingMessages(totalIncoming)
      } catch (error) {
        console.error('Error fetching incoming messages:', error)
        if (mounted) {
          setIncomingMessages(0)
        }
      } finally {
        if (mounted) {
          setMessagesLoading(false)
        }
      }
    }

    fetchIncomingMessages()

    return () => {
      mounted = false
    }
  }, [])

  // Total produk = semua produk yang ada (tanpa filter status)
  const totalProducts = products.length

  // Stock Aman = produk yang stoknya tidak sedikit dan tidak habis
  // (diinterpretasikan sebagai stok > 10)
  const safeStockProducts = products.filter((p) => p.stock > 10).length

  // Stok Rendah = stok tinggal sedikit (<= 10) namun masih tersedia (> 0)
  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock <= 10
  ).length

  // Pesan Masuk = total pesan dari developer pada manajemen developer

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 overflow-x-auto">
      <Card className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
        <CardContent className="flex flex-col gap-2 py-6">
          <p className="text-sm uppercase tracking-wide text-slate-300">
            Staff Dashboard
          </p>
          <h1 className="text-3xl font-bold">
            Selamat datang, {userName}
          </h1>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              Jumlah seluruh produk yang terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Aman</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              Produk dengan stok &gt; 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              Produk dengan stok 1-10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesan Masuk</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messagesLoading ? '-' : incomingMessages}
            </div>
            <p className="text-xs text-muted-foreground">
              Pesan masuk dari Manajemen Developer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
      </div>

      {/* Performance & Activity Section */}
      <div className="grid gap-4 lg:grid-cols-2">
      </div>
    </div>
  )
}

