import { Trash2, Plus, Minus } from "lucide-react"
import { useState } from "react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/layouts/app/context/CartContext"
import RootLayout from "@/layouts/app/RootLayouts"

export default function KeranjangPage() {
  return (
    <RootLayout>
      <KeranjangContent />
    </RootLayout>
  )
}

function KeranjangContent() {
  const { toast } = useToast()
  const { items, removeFromCart, updateQuantity, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleQuantityChange = (id: number, change: number) => {
    const item = items.find(i => i.id === id)
    if (item) {
      const newQuantity = item.quantity + change
      updateQuantity(id, newQuantity)
    }
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan produk terlebih dahulu sebelum checkout",
        duration: 1500,
      })
      return
    }

    setIsCheckingOut(true)

    try {
      const subtotalAmount = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity)
      }, 0)
      const shippingCostAmount = 20000
      const totalAmount = subtotalAmount + shippingCostAmount

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image || null,
          })),
          subtotal: subtotalAmount,
          shipping_cost: shippingCostAmount,
          total: totalAmount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        clearCart()
        toast({
          title: "Berhasil ✅",
          description: "Pesanan Anda telah berhasil disimpan",
          duration: 1500,
        })
        setTimeout(() => {
          window.location.href = "/history-pembelian"
        }, 1500)
      } else {
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ")
          : data.message || "Terjadi kesalahan saat checkout"
        toast({
          title: "Gagal",
          description: errorMsg,
          variant: "destructive",
          duration: 2000,
        })
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan koneksi saat checkout",
        variant: "destructive",
        duration: 1500,
      })
    } finally {
      setIsCheckingOut(false)
    }
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)

  const shippingCost = 20000
  const total = subtotal + shippingCost

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
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
              <BreadcrumbLink href="/keranjang">Keranjang</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Keranjang Belanja </h1>
          {items.length > 0 && (
            <p className="text-sm text-muted-foreground">{items.length} item</p>
          )}
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Keranjang Anda kosong</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                        <p className="text-sm font-medium text-green-600 mt-1">
                          Subtotal: {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Belanja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pengiriman</span>
                    <span>{formatCurrency(shippingCost)}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? "Memproses..." : "Checkout"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
