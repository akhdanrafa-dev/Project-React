import { useState } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useCatalog } from "@/layouts/app/context/CatalogContext"
import RootLayout from "@/layouts/app/RootLayouts"
import { catalogCategories } from "@/lib/catalog"


export default function DeveloperIntegrationPage() {
  return (
    <RootLayout hideFloatingChat>
      <DeveloperIntegrationContent />
    </RootLayout>
  )
}

function DeveloperIntegrationContent() {
  const { products } = useCatalog()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedStockFilter, setSelectedStockFilter] = useState<string | null>(null)

  const getStockCategory = (stock: number) => {
    if (stock === 0) return "habis"
    if (stock < 10) return "sedikit"
    if (stock < 30) return "sedikit"
    if (stock < 50) return "cukup"
    return "lebih"
  }

  let filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products

  if (selectedStockFilter) {
    filteredProducts = filteredProducts.filter((product) => {
      const stockCat = getStockCategory(product.stock)
      return stockCat === selectedStockFilter
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
              <BreadcrumbLink href="/developer-dashboard">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/developer/integration">
                Pantau Produk
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="text-3xl font-bold mb-3">Pantau Produk</h1>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Kategori Produk</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="gap-2"
            >
              Semua Produk ({products.length})
            </Button>

            {catalogCategories.map((category) => {
              const Icon = category.icon
              const count = products.filter((product) => product.category === category.id).length
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`gap-2 ${selectedCategory === category.id ? "" : category.color}`}
                >
                  <Icon className="h-5 w-5" />
                  {category.name} ({count})
                </Button>
              )
            })}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Stok Produk</h2>
          <select
            value={selectedStockFilter || ""}
            onChange={(e) => setSelectedStockFilter(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-950 text-black dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
          >
            <option value="">Semua Stok</option>
            <option value="lebih">Lebih</option>
            <option value="cukup">Cukup</option>
            <option value="sedikit">Sedikit</option>
            <option value="habis">Habis</option>
          </select>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-2">{product.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-lg font-semibold text-green-600">
                  Rp {product.price.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stok: {product.stock} unit
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Pencarian Tidak Ada
            </p>
          </div>
        )}
      </div>
    </>
  )
}
