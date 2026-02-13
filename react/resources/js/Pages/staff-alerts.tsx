import { Head } from '@inertiajs/react'
import { Check, X, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react"
import { useState, useEffect } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem as BreadcrumbItemData } from '@/types';

interface Alert {
  id: number;
  product_id: number;
  developer_id: number;
  alert_type: string;
  new_value?: string;
  description: string;
  status: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  completed_by?: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    stock: number;
    price: number;
    image?: string;
    description?: string;
  };
  developer?: {
    id: number;
    name: string;
  };
}

const breadcrumbs: BreadcrumbItemData[] = [
    {
        title: 'Notifikasi Produk',
        href: '/staff-alerts',
    },
];

export default function StaffAlerts() {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([])
  const [historyAlerts, setHistoryAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmingAlertId, setConfirmingAlertId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    fetchActiveAlerts()
    const interval = setInterval(fetchActiveAlerts, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveAlerts = async () => {
    try {
      const response = await fetch('/alerts/staff')
      const data = await response.json()
      setActiveAlerts(data.alerts || [])
    } catch (error) {
      console.error('Error fetching active alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHistoryAlerts = async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch('/alerts/staff/history')
      const data = await response.json()
      setHistoryAlerts(data.alerts || [])
    } catch (error) {
      console.error('Error fetching history alerts:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleTabChange = (tab: 'active' | 'history') => {
    setActiveTab(tab)
    if (tab === 'history' && historyAlerts.length === 0) {
      fetchHistoryAlerts()
    }
  }

  const handleCompleteAlert = async (alert: Alert, action: 'confirm' | 'cancel') => {
    try {
      const response = await fetch(`/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        setConfirmingAlertId(null)
        fetchActiveAlerts()
        if (historyAlerts.length > 0) {
          fetchHistoryAlerts()
        }
        window.alert(`Alert ${action === 'confirm' ? 'selesai' : 'ditolak'} successfully`)
      }
    } catch (error) {
      console.error('Error updating alert:', error)
      window.alert('Failed to update alert')
    }
  }

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)

  const isValidUrl = (value?: string): boolean => {
    if (!value) return false
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  const formatNewValue = (alert: Alert): string => {
    if (!alert.new_value) return '-'

    if (alert.alert_type === 'stock') {
      return `${alert.new_value} unit`
    }

    if (alert.alert_type === 'price') {
      const price = Number(alert.new_value)
      return Number.isFinite(price) ? formatPrice(price) : alert.new_value
    }

    return alert.new_value
  }

  const getAlertTypeLabel = (type: string): string => {
    switch (type) {
      case 'stock': return 'Ubah Stok'
      case 'banner': return 'Ganti Banner'
      case 'price': return 'Ubah Harga'
      case 'name': return 'Ubah Nama'
      case 'description': return 'Ubah Deskripsi'
      default: return type
    }
  }

  const getAlertTypeColor = (type: string): string => {
    switch (type) {
      case 'stock': return 'bg-blue-100 text-blue-800'
      case 'banner': return 'bg-orange-100 text-orange-800'
      case 'price': return 'bg-emerald-100 text-emerald-800'
      case 'name': return 'bg-purple-100 text-purple-800'
      case 'description': return 'bg-cyan-100 text-cyan-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const displayAlerts = activeTab === 'active' ? activeAlerts : historyAlerts
  const isCurrentLoading = activeTab === 'active' ? isLoading : isLoadingHistory

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notifikasi Produk" />

      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/staff-dashboard">Beranda</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/staff-alerts">Notifikasi Produk</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-3xl font-bold">Notifikasi Produk</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola peringatan dari developer tentang produk</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'active' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('active')}
            className={activeTab === 'active' ? '' : 'border-b-2 border-transparent'}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Notifikasi Aktif ({activeAlerts.length})
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('history')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Riwayat ({historyAlerts.length})
          </Button>
        </div>

        {isCurrentLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Memuat notifikasi...</p>
            </CardContent>
          </Card>
        ) : displayAlerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {activeTab === 'active' ? 'Tidak ada notifikasi baru' : 'Tidak ada riwayat notifikasi'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayAlerts.map((alert) => (
              <Card key={alert.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg">{alert.product?.name}</CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        SKU: {alert.product?.sku}
                      </CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getAlertTypeColor(alert.alert_type)}`}>
                      {getAlertTypeLabel(alert.alert_type)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>Dari Developer:</strong> {alert.developer?.name}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">NILAI SAAT INI</p>
                        {alert.alert_type === 'stock' && (
                          <p className="font-mono text-base">{alert.product?.stock} unit</p>
                        )}
                        {alert.alert_type === 'banner' && (
                          <div className="space-y-2">
                            {alert.product?.image ? (
                              <>
                                <p className="font-mono text-xs break-all">{alert.product.image}</p>
                                <img
                                  src={alert.product.image}
                                  alt={alert.product?.name ?? 'Banner produk'}
                                  className="h-20 w-20 rounded object-cover border border-gray-200"
                                />
                              </>
                            ) : (
                              <p className="font-mono text-xs">(Belum ada banner)</p>
                            )}
                          </div>
                        )}
                        {alert.alert_type === 'price' && (
                          <p className="font-mono text-base">
                            {Number.isFinite(Number(alert.product?.price))
                              ? formatPrice(Number(alert.product?.price))
                              : '-'}
                          </p>
                        )}
                        {alert.alert_type === 'name' && (
                          <p className="font-mono text-base break-words">{alert.product?.name}</p>
                        )}
                        {alert.alert_type === 'description' && (
                          <p className="font-mono text-xs break-words">{alert.product?.description || '(Kosong)'}</p>
                        )}
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="text-xs font-semibold text-green-700 mb-1">NILAI BARU</p>
                        {alert.alert_type === 'banner' && isValidUrl(alert.new_value) ? (
                          <div className="space-y-2">
                            <p className="font-mono text-xs break-all text-green-900">{alert.new_value}</p>
                            <img
                              src={alert.new_value}
                              alt={`Banner baru ${alert.product?.name ?? ''}`.trim()}
                              className="h-20 w-20 rounded object-cover border border-green-200"
                            />
                          </div>
                        ) : (
                          <p className="font-mono text-base break-words text-green-900">{formatNewValue(alert)}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-sm">
                      <strong>Keterangan dari Developer:</strong>
                      <p className="bg-white p-2 rounded mt-1 text-sm">{alert.description}</p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(alert.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {activeTab === 'active' ? (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => setConfirmingAlertId(alert.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Selesai
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleCompleteAlert(alert, 'cancel')}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Tolak
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-4">
                      {alert.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm font-medium">Selesai</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Ditolak</span>
                        </div>
                      )}
                      {alert.completed_at && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(alert.completed_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={confirmingAlertId !== null} onOpenChange={(open) => {
        if (!open) setConfirmingAlertId(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penyelesaian</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin telah menyelesaikan perubahan yang diminta?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmingAlertId(null)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => {
                const alert = activeAlerts.find(a => a.id === confirmingAlertId)
                if (alert) {
                  handleCompleteAlert(alert, 'confirm')
                }
              }}
            >
              Ya, Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
