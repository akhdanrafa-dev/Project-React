import { Head } from '@inertiajs/react'
import { BarChart3, FileText, Package, Settings } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AppLayout from '@/layouts/app-layout'
import { dashboard } from '@/routes'
import type { BreadcrumbItem } from '@/types'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Staff Dashboard',
    href: dashboard().url,
  },
]

export default function StaffDashboard() {
  return (
    <AppLayout>
      <Head title="Staff Dashboard" />

      <div className="flex flex-1 flex-col gap-6 p-4 overflow-x-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selamat datang di panel staff Anda
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Laporan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Laporan
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                Laporan bulan ini
              </p>
            </CardContent>
          </Card>

          {/* Produk Dikelola */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Produk Dikelola
              </CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                Total produk aktif
              </p>
            </CardContent>
          </Card>

          {/* Total Penjualan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Penjualan
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 45.2M</div>
              <p className="text-xs text-muted-foreground">
                Bulan ini
              </p>
            </CardContent>
          </Card>

          {/* Tugas Pending */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Tugas Pending
              </CardTitle>
              <Settings className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Menunggu dikerjakan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Aktivitas Terbaru */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Aktivitas Terbaru
              </CardTitle>
              <CardDescription>
                Laporan dan dokumen terbaru
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm font-medium">
                    Laporan Penjualan Harian
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hari ini, 10:30 AM
                  </p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-sm font-medium">
                    Update Stok Produk
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kemarin, 02:15 PM
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Verifikasi Produk Baru
                  </p>
                  <p className="text-xs text-muted-foreground">
                    2 hari lalu, 09:00 AM
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ringkasan Performa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Ringkasan Performa
              </CardTitle>
              <CardDescription>
                Statistik kinerja staff
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Laporan Selesai
                </span>
                <span className="text-lg font-bold text-green-600">
                  95%
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: '95%' }}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">
                  Waktu Respons
                </span>
                <span className="text-lg font-bold text-blue-600">
                  2.5 jam
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">
                  Akurasi Data
                </span>
                <span className="text-lg font-bold text-purple-600">
                  98%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}