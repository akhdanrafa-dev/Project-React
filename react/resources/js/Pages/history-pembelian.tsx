import { useCallback, useEffect, useState } from "react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useToast } from "@/components/ui/use-toast"
import RootLayout from "@/layouts/app/RootLayouts"

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
  image?: string
}

interface Order {
  id: number
  subtotal: number
  shipping_cost: number
  total: number
  status: string
  created_at: string
  items: OrderItem[]
}

export default function HistoryPembelianPage() {
  return (
    <RootLayout>
      <HistoryPembelianContent />
    </RootLayout>
  )
}

function HistoryPembelianContent() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/orders", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        toast({
          title: "Error",
          description: "Gagal mengambil data riwayat pembelian",
          duration: 1500,
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengambil data",
        duration: 1500,
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/history-pembelian">Riwayat Pembelian</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Riwayat Pembelian</h1>
          <p className="text-muted-foreground">Lihat semua pembelian Anda</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Memuat data...</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Anda belum memiliki pembelian</p>
              <Button variant="outline" className="mt-4" onClick={() => (window.location.href = "/katalog")}>
                Belanja Sekarang
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          {order.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                        <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product_name}</h3>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium text-green-600 mt-1">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}

                    <div className="space-y-2 mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pengiriman</span>
                        <span>{formatCurrency(order.shipping_cost)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-green-600">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
