import { Head } from '@inertiajs/react'
import { User, TrendingUp, CheckCircle2, Clock, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AdminITLayout from '@/layouts/app/AdminITLayout'

interface AdminProfile {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

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

export default function AdminITProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const adminId = getCurrentUserId()
        
        const profileResponse = await fetch('/user')
        if (!profileResponse.ok) {
          const meta = document.querySelector('meta[name="user-name"]')
          const email = document.querySelector('meta[name="user-email"]')
          if (meta && email) {
            setProfile({
              id: adminId,
              name: meta.getAttribute('content') || 'Admin IT',
              email: email.getAttribute('content') || 'admin@example.com',
              role: 'admin_it',
              created_at: new Date().toISOString(),
            })
          }
        } else {
          const profileData = await profileResponse.json()
          setProfile(profileData)
        }

        const statsResponse = await fetch(`/admin-it/statistics/${adminId}`)
        if (!statsResponse.ok) throw new Error('Failed to fetch statistics')
        const statsData = await statsResponse.json()
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getCurrentUserId = () => {
    const meta = document.querySelector('meta[name="user-id"]')
    return meta ? parseInt(meta.getAttribute('content') || '0') : 0
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
      <div className="space-y-4 p-4 md:p-6">
        <Head title="Profil Admin IT" />

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-400 flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile?.name || 'Admin IT'}</h1>
              <p className="text-blue-100">{profile?.email || 'admin@example.com'}</p>
              <p className="text-sm text-blue-100 mt-1">
                Bergabung sejak {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {stats && (
          <>
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ditangani</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_handled}</div>
                  <p className="text-xs text-muted-foreground">Sepanjang waktu</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terselesaikan</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
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
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.in_progress_count}</div>
                  <p className="text-xs text-muted-foreground">Menunggu selesai</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rata-rata Waktu</CardTitle>
                  <Zap className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.average_resolution_time.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground">Per tiket</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Period Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Pengambilan Tiket Berdasarkan Periode</CardTitle>
                  <CardDescription>Jumlah tiket yang diambil dalam berbagai periode</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Hari Ini</span>
                      <Badge className="bg-blue-100 text-blue-800">{stats.today}</Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${
                            Math.max(stats.today, stats.this_week, stats.this_month, stats.this_year) > 0
                              ? (stats.today /
                                  Math.max(stats.today, stats.this_week, stats.this_month, stats.this_year)) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Minggu Ini</span>
                      <Badge className="bg-purple-100 text-purple-800">{stats.this_week}</Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{
                          width: `${
                            Math.max(stats.today, stats.this_week, stats.this_month, stats.this_year) > 0
                              ? (stats.this_week /
                                  Math.max(stats.today, stats.this_week, stats.this_month, stats.this_year)) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Bulan Ini</span>
                      <Badge className="bg-green-100 text-green-800">{stats.this_month}</Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${
                            Math.max(stats.today, stats.this_week, stats.this_month, stats.this_year) > 0
                              ? (stats.this_month /
                                  Math.max(stats.today, stats.this_week, stats.this_month, stats.this_year)) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tahun Ini</span>
                      <Badge className="bg-orange-100 text-orange-800">{stats.this_year}</Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{
                          width: `${
                            Math.max(stats.today, stats.this_week, stats.this_month, stats.this_year) > 0
                              ? (stats.this_year /
                                  Math.max(stats.today, stats.this_week, stats.this_month, stats.this_year)) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Difficulty Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Tingkat Kesulitan</CardTitle>
                  <CardDescription>Tiket berdasarkan tingkat kesulitan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
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

                  <div>
                    <div className="flex justify-between items-center mb-2">
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

                  <div>
                    <div className="flex justify-between items-center mb-2">
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
          </>
        )}
      </div>
    </AdminITLayout>
  )
}
