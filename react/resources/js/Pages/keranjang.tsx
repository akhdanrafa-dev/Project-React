import { Trash2, Plus, Minus } from "lucide-react"
import { useState } from "react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/layouts/app/context/CartContext"
import { useCatalog } from "@/layouts/app/context/CatalogContext"
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
  const { products, getProduct, adjustStock, setStock } = useCatalog()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const resolveCatalogProduct = (item: typeof items[number]) => {
    const byId = getProduct(item.id)
    if (byId) return byId

    if (item.sku) {
      const bySku = products.find((product) => product.sku === item.sku)
      if (bySku) return bySku
    }

    return products.find((product) => product.name === item.name)
  }

  const handleQuantityChange = (id: number, change: number) => {
    const item = items.find(i => i.id === id)
    if (item) {
      const newQuantity = item.quantity + change
      const product = resolveCatalogProduct(item)

      if (change > 0 && product && newQuantity > product.stock) {
        toast({
          title: "Stok tidak cukup",
          description: `Stok tersedia hanya ${product.stock} unit`,
          variant: "destructive",
          duration: 1500,
        })
        return
      }

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

    const stockIssues = items
      .map((item) => {
        const product = resolveCatalogProduct(item)

        if (!product) {
          return `${item.name} tidak ditemukan di katalog.`
        }

        if (product.stock <= 0) {
          return `Stok ${product.name} sudah habis.`
        }

        if (item.quantity > product.stock) {
          return `Stok ${product.name} tersisa ${product.stock} unit.`
        }

        return null
      })
      .filter((value): value is string => Boolean(value))

    if (stockIssues.length > 0) {
      toast({
        title: "Checkout gagal",
        description: stockIssues.join(" "),
        variant: "destructive",
        duration: 2500,
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
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: resolveCatalogProduct(item)?.id ?? item.id,
            product_name: resolveCatalogProduct(item)?.name ?? item.name,
            sku: resolveCatalogProduct(item)?.sku ?? item.sku ?? null,
            quantity: item.quantity,
            price: item.price,
            image: resolveCatalogProduct(item)?.image || item.image || null,
          })),
          subtotal: subtotalAmount,
          shipping_cost: shippingCostAmount,
          total: totalAmount,
        }),
      })

      const contentType = response.headers.get("content-type") || ""
      const isJsonResponse = contentType.includes("application/json")
      const data: Record<string, unknown> | null = isJsonResponse
        ? await response.json()
        : null

      if (response.ok && isJsonResponse) {
        const updatedStocks: Array<{
          product_id?: number
          stock?: number
        }> = Array.isArray(data?.updated_stocks)
          ? (data.updated_stocks as Array<{ product_id?: number; stock?: number }>)
          : []

        if (updatedStocks.length > 0) {
          updatedStocks.forEach((entry) => {
            const productId = Number(entry?.product_id)
            const stock = Number(entry?.stock)

            if (Number.isFinite(productId) && Number.isFinite(stock)) {
              setStock(productId, stock)
            }
          })
        } else {
          items.forEach((item) => {
            adjustStock(item.id, -item.quantity)
          })
        }

        clearCart()
        toast({
          title: "Berhasil",
          description: "Pesanan Anda telah berhasil disimpan",
          duration: 1500,
        })
        setTimeout(() => {
          window.location.href = "/history-pembelian"
        }, 1500)
      } else {
        const maybeErrors = data?.errors
        const validationErrors = (
          maybeErrors &&
          typeof maybeErrors === "object"
            ? Object.values(
                maybeErrors as Record<string, unknown>
              ).flat()
            : []
        )
          .filter((value): value is string => typeof value === "string")

        const errorMsg = !isJsonResponse
          ? "Respons checkout tidak valid. Silakan login ulang lalu coba lagi."
          : validationErrors.length > 0
          ? validationErrors.join(", ")
          : (typeof data?.message === "string"
              ? data.message
              : `Checkout gagal (HTTP ${response.status})`)

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
        description: error instanceof Error
          ? `Terjadi kesalahan saat checkout: ${error.message}`
          : "Terjadi kesalahan koneksi saat checkout",
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

