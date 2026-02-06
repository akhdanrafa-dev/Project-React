import { Head, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar-trigger'
import AdminITLayout from '@/layouts/app/AdminITLayout'
import type { SharedData } from '@/types'

interface AdminStats {
  total_handled: number
  today: number
  this_week: number
  this_month: number
  this_year: number
  resolved_count: number
  in_progress_count: number
  average_resolution_time: number
  difficulty_breakdown: {
    easy: number
    medium: number
    hard: number
  }
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function AdminITStatistics() {
  const { auth } = usePage<SharedData>().props
  const adminId = auth?.user?.id ?? 0
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminId) {
      setError('Gagal mengidentifikasi admin yang sedang aktif. Silakan masuk ulang dan coba lagi.')
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`/admin-it/statistics/${adminId}`)
        if (!response.ok) throw new Error('Failed to fetch statistics')
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [adminId])

  if (loading) {
    return (
      <AdminITLayout>
        <div className="p-6">
          <div>Loading...</div>
        </div>
      </AdminITLayout>
    )
  }

  if (!stats) {
    return (
      <AdminITLayout>
        <div className="p-6">
          <div>Tidak ada data statistik</div>
        </div>
      </AdminITLayout>
    )
  }

  const timelineData = [
    { period: 'Hari Ini', count: stats.today },
    { period: 'Minggu Ini', count: stats.this_week },
    { period: 'Bulan Ini', count: stats.this_month },
    { period: 'Tahun Ini', count: stats.this_year },
  ]

  const difficultyData = [
    { name: 'Mudah', value: stats.difficulty_breakdown.easy },
    { name: 'Sedang', value: stats.difficulty_breakdown.medium },
    { name: 'Sulit', value: stats.difficulty_breakdown.hard },
  ]

  const resolutionData = [
    { name: 'Terselesaikan', value: stats.resolved_count },
    { name: 'Dalam Proses', value: stats.in_progress_count },
  ]

  return (
     <AdminITLayout>
       <Head title="Admin IT Dashboard" />
 
       <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
         <SidebarTrigger className="-ml-1" />
         <Separator orientation="vertical" className="mr-2 h-4" />
         <Breadcrumb>
           <BreadcrumbList>
             <BreadcrumbItem>
               <BreadcrumbLink href="/admin-it-dashboard">Admin IT Dashboard</BreadcrumbLink>
             </BreadcrumbItem>
           </BreadcrumbList>
         </Breadcrumb>
       </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistik Aktivitas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Analisis performa dan aktivitas penanganan tiket Anda
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tiket Ditangani</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_handled}</div>
              <p className="text-xs text-muted-foreground">Sepanjang waktu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terselesaikan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_handled > 0 ? `${((stats.resolved_count / stats.total_handled) * 100).toFixed(1)}%` : '0%'} success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.in_progress_count}</div>
              <p className="text-xs text-muted-foreground">Menunggu penyelesaian</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Waktu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_resolution_time.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Jam per tiket</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tiket Diambil Berdasarkan Periode</CardTitle>
              <CardDescription>
                Jumlah tiket yang diambil dalam berbagai periode waktu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Difficulty Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Tingkat Kesulitan</CardTitle>
              <CardDescription>
                Persentase tiket berdasarkan tingkat kesulitan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {difficultyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Resolution Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status Penyelesaian</CardTitle>
              <CardDescription>
                Perbandingan tiket yang sudah selesai dengan yang masih dalam proses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={resolutionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Difficulty Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Tingkat Kesulitan</CardTitle>
              <CardDescription>
                Rincian lengkap tiket berdasarkan kesulitan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mudah</span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats.difficulty_breakdown.easy}
                  </Badge>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${
                        stats.total_handled > 0
                          ? (stats.difficulty_breakdown.easy / stats.total_handled) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sedang</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {stats.difficulty_breakdown.medium}
                  </Badge>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{
                      width: `${
                        stats.total_handled > 0
                          ? (stats.difficulty_breakdown.medium / stats.total_handled) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sulit</span>
                  <Badge className="bg-red-100 text-red-800">
                    {stats.difficulty_breakdown.hard}
                  </Badge>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${
                        stats.total_handled > 0
                          ? (stats.difficulty_breakdown.hard / stats.total_handled) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminITLayout>
  )
}
