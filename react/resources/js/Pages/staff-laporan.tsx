import { Head } from '@inertiajs/react';
import { FileText, Download, Eye, Filter, Plus } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan',
        href: dashboard().url,
    },
];

export default function Laporan() {
  const [selectedFilter, setSelectedFilter] = useState("all")

  const reports = [
    {
      id: 1,
      title: "Laporan Penjualan Harian",
      date: "28 Jan 2025",
      type: "Penjualan",
      period: "Hari Ini",
      status: "Completed",
      size: "2.4 MB",
    },
    {
      id: 2,
      title: "Laporan Inventori Mingguan",
      date: "27 Jan 2025",
      type: "Inventori",
      period: "Minggu Ini",
      status: "Completed",
      size: "1.8 MB",
    },
    {
      id: 3,
      title: "Laporan Performa Staff Bulanan",
      date: "26 Jan 2025",
      type: "Performa",
      period: "Bulan Januari",
      status: "Completed",
      size: "3.2 MB",
    },
    {
      id: 4,
      title: "Laporan Analisis Trend Produk",
      date: "25 Jan 2025",
      type: "Analisis",
      period: "Q1 2025",
      status: "Pending",
      size: "2.1 MB",
    },
    {
      id: 5,
      title: "Laporan Penjualan Harian",
      date: "24 Jan 2025",
      type: "Penjualan",
      period: "Kemarin",
      status: "Completed",
      size: "2.3 MB",
    },
    {
      id: 6,
      title: "Laporan Return & Komplain",
      date: "23 Jan 2025",
      type: "Komplain",
      period: "Bulan Januari",
      status: "Completed",
      size: "1.5 MB",
    },
  ]

  const filteredReports = selectedFilter === "all" 
    ? reports 
    : reports.filter(r => r.type.toLowerCase() === selectedFilter.toLowerCase())

  const getTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      "Penjualan": "bg-blue-100 text-blue-800",
      "Inventori": "bg-green-100 text-green-800",
      "Performa": "bg-purple-100 text-purple-800",
      "Analisis": "bg-orange-100 text-orange-800",
      "Komplain": "bg-red-100 text-red-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const getStatusBadge = (status: string) => {
    return status === "Completed" 
      ? "bg-green-100 text-green-800" 
      : "bg-yellow-100 text-yellow-800"
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Laporan" />
      
      <div className="flex flex-1 flex-col gap-6 p-4 overflow-x-auto">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola dan download semua laporan bisnis</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">Semua periode</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Laporan Selesai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.filter(r => r.status === "Completed").length}</div>
              <p className="text-xs text-muted-foreground">Siap diunduh</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Laporan Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.filter(r => r.status === "Pending").length}</div>
              <p className="text-xs text-muted-foreground">Sedang diproses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tipe Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Kategori berbeda</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              onClick={() => setSelectedFilter("all")}
            >
              Semua
            </Button>
            <Button
              variant={selectedFilter === "penjualan" ? "default" : "outline"}
              onClick={() => setSelectedFilter("penjualan")}
            >
              Penjualan
            </Button>
            <Button
              variant={selectedFilter === "inventori" ? "default" : "outline"}
              onClick={() => setSelectedFilter("inventori")}
            >
              Inventori
            </Button>
            <Button
              variant={selectedFilter === "performa" ? "default" : "outline"}
              onClick={() => setSelectedFilter("performa")}
            >
              Performa
            </Button>
            <Button
              variant={selectedFilter === "analisis" ? "default" : "outline"}
              onClick={() => setSelectedFilter("analisis")}
            >
              Analisis
            </Button>
            <Button
              variant={selectedFilter === "komplain" ? "default" : "outline"}
              onClick={() => setSelectedFilter("komplain")}
            >
              Komplain
            </Button>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Laporan</CardTitle>
            <CardDescription>Total {filteredReports.length} laporan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{report.title}</h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge className={getTypeBadge(report.type)}>{report.type}</Badge>
                        <Badge variant="outline">{report.period}</Badge>
                        <Badge className={getStatusBadge(report.status)}>{report.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{report.date} • {report.size}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Lihat
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
