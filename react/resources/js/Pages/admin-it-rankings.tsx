import { Head } from '@inertiajs/react'
import { CheckCircle2, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

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
import AdminITLayout from '@/layouts/app/AdminITLayout'

interface AdminRanking {
  id: number
  name: string
  email: string
  total_handled: number
  resolved: number
  in_progress: number
  average_resolution_hours: number
  performance_score: number
}

export default function AdminITRankings() {
  const [rankings, setRankings] = useState<AdminRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('/admin-it/rankings')
        if (!response.ok) throw new Error('Failed to fetch rankings')
        const data = await response.json()
        setRankings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
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

  if (loading) {
    return (
      <AdminITLayout>
        <div className="p-6">
          <div>Loading...</div>
        </div>
      </AdminITLayout>
    )
  }

  return (
    <AdminITLayout>
      <Head title="Ranking Admin IT" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ranking Admin IT</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Performa dan peringkat semua admin berdasarkan metrik performa
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
        {rankings.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {rankings.slice(0, 3).map((admin, idx) => (
              <Card key={admin.id} className={idx === 0 ? 'border-yellow-400' : ''}>
                <CardHeader className="text-center">
                  <div className="text-4xl">{getMedalIcon(idx + 1)}</div>
                  <CardTitle className="text-lg">{admin.name}</CardTitle>
                  <CardDescription>{admin.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{admin.performance_score.toFixed(1)}</div>
                    <p className="text-sm text-muted-foreground">Skor Performa</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Ditangani</span>
                      <span className="font-medium">{admin.total_handled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Terselesaikan</span>
                      <span className="font-medium text-green-600">{admin.resolved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rata-rata Waktu</span>
                      <span className="font-medium">{admin.average_resolution_hours.toFixed(1)}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Full Rankings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Lengkap Admin IT</CardTitle>
            <CardDescription>
              Peringkat semua admin berdasarkan skor performa (70% resolution rate + 30% kecepatan)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Total Tiket</TableHead>
                    <TableHead className="text-right">Terselesaikan</TableHead>
                    <TableHead className="text-right">Dalam Proses</TableHead>
                    <TableHead className="text-right">Rata-rata Waktu</TableHead>
                    <TableHead className="text-right">Skor Performa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((admin, idx) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMedalIcon(idx + 1) && (
                            <span className="text-lg">{getMedalIcon(idx + 1)}</span>
                          )}
                          <span className="font-bold text-lg">#{idx + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {admin.email}
                      </TableCell>
                      <TableCell className="text-right">{admin.total_handled}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          {admin.resolved}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {admin.in_progress}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {admin.average_resolution_hours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={getPerformanceColor(admin.performance_score)}>
                          {admin.performance_score.toFixed(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics Explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cara Perhitungan Skor Performa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Resolution Rate (70%)</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Persentase tiket yang sudah terselesaikan dari total tiket yang ditangani
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Kecepatan Penyelesaian (30%)</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Rata-rata waktu yang dihabiskan untuk menyelesaikan satu tiket (semakin cepat semakin baik)
              </p>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Rumus:</span> (Resolution Rate × 0.7) + (Speed Score × 0.3)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Summary */}
        {rankings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Statistik Tim</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Tim Admin</p>
                <p className="text-2xl font-bold">{rankings.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tiket Ditangani</p>
                <p className="text-2xl font-bold">
                  {rankings.reduce((sum, admin) => sum + admin.total_handled, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Terselesaikan</p>
                <p className="text-2xl font-bold">
                  {rankings.reduce((sum, admin) => sum + admin.resolved, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Skor Performa</p>
                <p className="text-2xl font-bold">
                  {(
                    rankings.reduce((sum, admin) => sum + admin.performance_score, 0) /
                    rankings.length
                  ).toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminITLayout>
  )
}
