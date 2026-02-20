import { Head } from '@inertiajs/react'
import { TrendingUp, Award, Zap, Calendar } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import DeveloperLayout from '@/layouts/app/DeveloperLayout'

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
  resolved_last_two_days: number
  average_resolved_per_day: number
}

export default function AdminITRankingAdmin() {
  const [stats, setStats] = useState<AdminStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sortedStats = useMemo(() => {
    return [...stats].sort((a, b) => {
      if (b.this_month !== a.this_month) return b.this_month - a.this_month
      if (b.total_tickets !== a.total_tickets) return b.total_tickets - a.total_tickets
      if (b.performance_score !== a.performance_score) {
        return b.performance_score - a.performance_score
      }
      return b.resolved - a.resolved
    })
  }, [stats])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/admin-it/rankings/activity-stats')
        if (!response.ok) throw new Error('Failed to fetch admin activity stats')
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getActivityLevel = (
    resolvedLastTwoDays: number,
    averageResolvedPerDay: number
  ) => {
    if (resolvedLastTwoDays === 0) {
      return { label: 'Kurang Aktif', color: 'bg-gray-100 text-gray-800' }
    }
    if (averageResolvedPerDay >= 3) {
      return { label: 'Sangat Aktif', color: 'bg-green-100 text-green-800' }
    }
    if (averageResolvedPerDay >= 1) {
      return { label: 'Aktif', color: 'bg-blue-100 text-blue-800' }
    }
    return { label: 'Kurang Aktif', color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <DeveloperLayout>
        <div className="p-6">
          <div>Loading...</div>
        </div>
      </DeveloperLayout>
    )
  }

  return (
    <DeveloperLayout>
      <Head title="Ranking Admin IT - Aktivitas" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ranking Admin IT</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Peringkat admin IT berdasarkan aktivitas dan performa penanganan tiket
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        {sortedStats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {sortedStats.slice(0, 3).map((admin, idx) => {
              const activity = getActivityLevel(
                admin.resolved_last_two_days,
                admin.average_resolved_per_day
              )
              return (
                <Card
                  key={admin.id}
                  className={idx === 0 ? 'border-yellow-400 shadow-lg' : ''}
                >
                  <CardHeader className="text-center">
                    <div className="text-4xl">{getMedalIcon(idx + 1)}</div>
                    <CardTitle className="text-lg mt-2">{admin.name}</CardTitle>
                    <CardDescription>{admin.email}</CardDescription>
                    <Badge className={`mt-2 w-fit mx-auto ${activity.color}`}>
                      {activity.label}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {admin.this_month}
                        </p>
                        <p className="text-xs text-muted-foreground">Bulan Ini</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {admin.total_tickets}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Terselesaikan</span>
                        <span className="font-medium text-green-600">
                          {admin.resolved} ({admin.resolution_rate}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dalam Proses</span>
                        <span className="font-medium text-yellow-600">
                          {admin.in_progress}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Skor Performa</span>
                        <Badge className={getPerformanceColor(admin.performance_score)}>
                          {admin.performance_score.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Overview Statistics */}
        {sortedStats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Admin</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sortedStats.length}</div>
                <p className="text-xs text-muted-foreground">Tim Admin IT</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tiket Bulan Ini
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sortedStats.reduce((sum, admin) => sum + admin.this_month, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Ditangani dalam sebulan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tiket</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sortedStats.reduce((sum, admin) => sum + admin.total_tickets, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Semua waktu</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rata-rata Skor
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(
                    sortedStats.reduce((sum, admin) => sum + admin.performance_score, 0) /
                    sortedStats.length
                  ).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Tim secara keseluruhan</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Lengkap Aktivitas Admin IT</CardTitle>
            <CardDescription>
              Peringkat berdasarkan aktivitas bulan ini dan performa penanganan tiket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-center">Bulan Ini</TableHead>
                    <TableHead className="text-center">Total Tiket</TableHead>
                    <TableHead className="text-center">Terselesaikan</TableHead>
                    <TableHead className="text-center">Dalam Proses</TableHead>
                    <TableHead className="text-center">Belum Diproses</TableHead>
                    <TableHead className="text-center">Rata-rata Waktu</TableHead>
                    <TableHead className="text-right">Skor Performa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStats.map((admin, idx) => {
                    const activity = getActivityLevel(
                      admin.resolved_last_two_days,
                      admin.average_resolved_per_day
                    )
                    return (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMedalIcon(idx + 1) && (
                              <span className="text-lg">
                                {getMedalIcon(idx + 1)}
                              </span>
                            )}
                            <span className="font-bold">#{idx + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{admin.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {admin.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium">{admin.this_month}</span>
                            <Badge className={activity.color}>{activity.label}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {admin.total_tickets}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800">
                            {admin.resolved} ({admin.resolution_rate}%)
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {admin.in_progress}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-gray-100 text-gray-800">
                            {admin.pending}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {admin.average_resolution_hours.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={getPerformanceColor(
                              admin.performance_score
                            )}
                          >
                            {admin.performance_score.toFixed(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Activity Definition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategori Aktivitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-1">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800 mt-1">
                  Sangat Aktif
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Minimal 3 tiket selesai per hari (rata-rata 2 hari terakhir)
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-800 mt-1">Aktif</Badge>
                <span className="text-sm text-muted-foreground">
                  Minimal 1 tiket selesai per hari (rata-rata 2 hari terakhir)
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-gray-100 text-gray-800 mt-1">
                  Kurang Aktif
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Tidak ada tiket selesai dalam 2 hari terakhir atau rata-rata
                  kurang dari 1 tiket per hari
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metrik Performa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Skor Performa</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Kombinasi dari resolution rate (70%) dan kecepatan penyelesaian (30%)
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium">Resolution Rate</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Persentase tiket yang sudah terselesaikan dari total tiket yang ditangani
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Rata-rata Waktu Penyelesaian</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Rata-rata jam yang dihabiskan untuk menyelesaikan satu tiket (semakin cepat semakin baik)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DeveloperLayout>
  )
}
