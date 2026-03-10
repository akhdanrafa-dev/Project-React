"use client"

import { router } from "@inertiajs/react"
import { ShoppingBag, BarChart3 } from "lucide-react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useCart } from "@/layouts/app/context/CartContext"
import { useCatalog } from "@/layouts/app/context/CatalogContext"
import RootLayout from "@/layouts/app/RootLayouts"

function UserDashboardContent() {
  const { items } = useCart()
  const { products } = useCatalog()
  const discountedProducts = products.filter((product) => {
    const discountValue = Number(product.discount ?? 0)
    return Number.isFinite(discountValue) && discountValue > 0
  })

  const getDiscountPercentage = (discount?: number) => {
    if (!Number.isFinite(discount)) return 0
    return Math.min(100, Math.max(0, Number(discount)))
  }

  const getDiscountedPrice = (price: number, discount?: number) => {
    const discountPercentage = getDiscountPercentage(discount)
    return Math.max(0, Math.round(price - (price * discountPercentage) / 100))
  }

  const formatPrice = (price: number) =>
    price.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    })

  const formatDiscountTag = (discount?: number) => {
    const value = getDiscountPercentage(discount)
    return `${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}% OFF`
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
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Katalog Produk */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Katalog Produk</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length} Produk</div>
              <p className="text-xs text-muted-foreground">
                Produk elektronik tersedia
              </p>
              <Button
                className="mt-4 w-full"
                onClick={() => router.visit('/katalog')}
              >
                Lihat Katalog
              </Button>
            </CardContent>
          </Card>

          {/* Keranjang */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Keranjang</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length} Item</div>
              <p className="text-xs text-muted-foreground">
                Item di keranjang Anda
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => router.visit('/keranjang')}
              >
                Lihat Keranjang
              </Button>
            </CardContent>
          </Card>
        </div>

        {discountedProducts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Produk Diskon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {discountedProducts.slice(0, 6).map((product) => {
                  const finalPrice = getDiscountedPrice(product.price, product.discount)

                  return (
                    <div key={product.id} className="rounded-lg border p-3">
                      <div className="relative mb-3 aspect-video overflow-hidden rounded-md bg-muted">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                          {formatDiscountTag(product.discount)}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm font-medium">{product.name}</p>

                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-sm font-semibold text-green-700">
                          {formatPrice(finalPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  )
}

export default function UserDashboard() {
  return (
    <RootLayout>
      <UserDashboardContent />
    </RootLayout>
  )
}
