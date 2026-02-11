import { Head, usePage } from '@inertiajs/react'
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  FileText,
  MessageSquare,
  Package,
  Trophy,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
import {
  CatalogProvider,
  useCatalog,
} from '@/layouts/app/context/CatalogContext'
import DeveloperLayout from '@/layouts/app/DeveloperLayout'
import { initialStaffConversations } from '@/lib/staff-conversations'
import type { SharedData } from '@/types'

interface AdminStats {
  id: number
  name: string
  email: string
  total_tickets: number
  resolved: number
  in_progress: number
  pending: number
  this_month: number
  this_year: number
  average_resolution_hours: number
  performance_score: number
  resolution_rate: number
}

interface BugTicket {
  status?: string | null
}

const countIncomingStaffMessages = () => {
  return Object.values(initialStaffConversations).reduce((total, messages) => {
    const incoming = messages.filter((msg) => msg.sender === 'staff').length
    return total + incoming
  }, 0)
}

export default function DeveloperDashboard() {
  return (
    <DeveloperLayout>
      <CatalogProvider>
        <DeveloperDashboardContent />
      </CatalogProvider>
    </DeveloperLayout>
  )
}

function DeveloperDashboardContent() {
  const { auth } = usePage<SharedData>().props
  const userName = auth?.user?.name || 'Developer'
  const { products } = useCatalog()

  const [adminStats, setAdminStats] = useState<AdminStats[]>([])
  const [rankingLoading, setRankingLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(true)
  const [reportCount, setReportCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchAdminStats = async () => {
      const response = await fetch('/admin-it/rankings/activity-stats', {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      if (!response.ok) {
        throw new Error('Gagal mengambil ranking admin')
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }

    const fetchBugTickets = async () => {
      const response = await fetch('/api/bug-tickets', {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      if (!response.ok) {
        throw new Error('Gagal mengambil data laporan')
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }

    const loadDashboardData = async () => {
      setRankingLoading(true)
      setReportLoading(true)

      const [rankingResult, ticketResult] = await Promise.allSettled([
        fetchAdminStats(),
        fetchBugTickets(),
      ])

      if (!isMounted) return

      if (rankingResult.status === 'fulfilled') {
        setAdminStats(rankingResult.value)
      } else {
        console.error(rankingResult.reason)
      }

      if (ticketResult.status === 'fulfilled') {
        const tickets: BugTicket[] = ticketResult.value
        const incomingReports = tickets.filter(
          (ticket) => ticket.status?.toLowerCase() !== 'closed'
        )
        setReportCount(incomingReports.length)
      } else {
        console.error(ticketResult.reason)
        setReportCount(0)
      }

      setRankingLoading(false)
      setReportLoading(false)
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const incomingStaffMessages = useMemo(() => countIncomingStaffMessages(), [])

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock > 0 && product.stock <= 10),
    [products]
  )
  const outOfStockProducts = useMemo(
    () => products.filter((product) => product.stock === 0),
    [products]
  )
  const safeStockProducts = useMemo(
    () => products.filter((product) => product.stock > 10),
    [products]
  )

  const sortedAdminStats = useMemo(() => {
    return [...adminStats].sort((a, b) => {
      if (b.this_month !== a.this_month) return b.this_month - a.this_month
      if (b.total_tickets !== a.total_tickets) {
        return b.total_tickets - a.total_tickets
      }
      if (b.performance_score !== a.performance_score) {
        return b.performance_score - a.performance_score
      }
      return b.resolved - a.resolved
    })
  }, [adminStats])

  const topAdmins = useMemo(() => sortedAdminStats.slice(0, 5), [sortedAdminStats])

  return (
    <>
      <Head title='Developer Dashboard' />
      <header className='flex h-16 items-center gap-2 border-b border-border bg-background px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/developer-dashboard'>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
        <Card className='bg-gradient-to-r from-slate-900 to-slate-700 text-white'>
          <CardContent className='flex flex-col gap-2 py-6'>
            <p className='text-sm uppercase tracking-wide text-slate-300'>
              Developer Dashboard
            </p>
            <h1 className='text-3xl font-bold'>
              Selamat datang, {userName}
            </h1>
          </CardContent>
        </Card>

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>
                Pesan Masuk Staff
              </CardTitle>
              <MessageSquare className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{incomingStaffMessages}</div>
              <p className='text-xs text-muted-foreground'>
                Pesan terbaru dari staff untuk ditindaklanjuti
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>
                Laporan Masuk
              </CardTitle>
              <FileText className='h-4 w-4 text-indigo-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {reportLoading ? '-' : reportCount}
              </div>
              <p className='text-xs text-muted-foreground'>
                Laporan bug user yang masih aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>
                Produk Hampir Habis
              </CardTitle>
              <AlertTriangle className='h-4 w-4 text-orange-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{lowStockProducts.length}</div>
              <p className='text-xs text-muted-foreground'>
                {outOfStockProducts.length} produk sudah habis stok
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>
                Stock Aman
              </CardTitle>
              <CheckCircle2 className='h-4 w-4 text-emerald-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{safeStockProducts.length}</div>
              <p className='text-xs text-muted-foreground'>
                Produk dengan stok &gt; 10
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Produk
              </CardTitle>
              <Package className='h-4 w-4 text-emerald-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{products.length}</div>
              <p className='text-xs text-muted-foreground'>
                Produk aktif di katalog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>
                Ranking Admin IT
              </CardTitle>
              <Trophy className='h-4 w-4 text-yellow-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {rankingLoading ? '-' : sortedAdminStats.length}
              </div>
              <p className='text-xs text-muted-foreground'>
                Admin terdaftar dalam ranking
              </p>
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-4 lg:grid-cols-3'>
        </div>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Ranking Admin IT</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Performa admin berdasarkan penyelesaian tiket
              </p>
            </div>
            <Button variant='outline' size='sm' asChild>
              <a href='/admin-it/ranking-admin'>Lihat Detail</a>
            </Button>
          </CardHeader>
          <CardContent>
            {rankingLoading ? (
              <div className='text-sm text-muted-foreground py-6'>
                Memuat ranking...
              </div>
            ) : topAdmins.length > 0 ? (
              <div className='space-y-4'>
                {topAdmins.map((admin, index) => (
                  <div key={admin.id} className='flex items-center justify-between border-b pb-3 last:border-b-0'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-full bg-muted'>
                        {index === 0 ? (
                          <Crown className='h-4 w-4 text-yellow-500' />
                        ) : (
                          <span className='text-sm font-semibold'>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className='text-sm font-semibold'>{admin.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {admin.resolved}/{admin.total_tickets} tiket selesai
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-semibold'>
                        Skor {admin.performance_score.toFixed(1)}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Avg {admin.average_resolution_hours.toFixed(1)} jam
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-sm text-muted-foreground py-6'>
                Belum ada data ranking admin.
              </div>
            )}
          </CardContent>
        </Card>

        <div className='grid gap-4 lg:grid-cols-2'>
        </div>
      </div>
    </>
  )
}
