import { Head } from "@inertiajs/react"
import { Search } from "lucide-react"
import { useState } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { CatalogProvider, useCatalog } from "@/layouts/app/context/CatalogContext"
import DeveloperLayout from "@/layouts/app/DeveloperLayout"

export default function DeveloperPantauProdukPage() {
  return (
    <DeveloperLayout>
      <CatalogProvider>
        <Head title="Pantau Produk" />
        <DeveloperPantauProdukContent />
      </CatalogProvider>
    </DeveloperLayout>
  )
}

function DeveloperPantauProdukContent() {
  const { products, categories } = useCatalog()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
  const [selectedStockFilter, setSelectedStockFilter] = useState<string | null>(null)

  const getStockGroup = (stock: number) => {
    if (stock === 0) return "Habis"
    if (stock <= 10) return "Sedikit"
    if (stock <= 20) return "Cukup"
    if (stock <= 50) return "Banyak"
    return "Banyak"
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.sku.toLowerCase().includes(normalizedSearch)
    const matchesCategory = !selectedCategoryFilter || product.category === selectedCategoryFilter
    const matchesStock = !selectedStockFilter || getStockGroup(product.stock) === selectedStockFilter

    return matchesSearch && matchesCategory && matchesStock
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.name ?? categoryId
  }

  const getStatusLabel = (stock: number) => {
    if (stock === 0) return "Out of Stock"
    if (stock < 10) return "Low Stock"
    return "Active"
  }

  const getStatusBadge = (status: string) => {
    if (status === "Active") {
      return "bg-green-100 text-green-800"
    }
    if (status === "Low Stock") {
      return "bg-yellow-100 text-yellow-800"
    }
    return "bg-gray-100 text-gray-800"
  }

  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/developer-dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/developer/pantau-produk">Pantau Produk</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold">Pantau Produk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lihat stok, kategori, dan harga produk tanpa mengubah data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pencarian & Filter</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk atau SKU..."
                className="pl-8"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <select
              value={selectedCategoryFilter ?? ""}
              onChange={(event) => setSelectedCategoryFilter(event.target.value || null)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStockFilter ?? ""}
              onChange={(event) => setSelectedStockFilter(event.target.value || null)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="">Semua Stok</option>
              <option value="Banyak">Banyak</option>
              <option value="Cukup">{"Cukup"}</option>
              <option value="Sedikit">{"Sedikit"}</option>
              <option value="Habis">Habis</option>
            </select>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Daftar Produk</h2>
              <p className="text-muted-foreground">Total {filteredProducts.length} produk</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const statusLabel = getStatusLabel(product.stock)
              return (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none"
                        }}
                      />
                    ) : null}
                  </div>

                  <CardHeader>
                    <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-sm text-muted-foreground">
                      Kategori: {getCategoryName(product.category)}
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatPrice(product.price)}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stok</span>
                      <span className="font-medium">{product.stock} unit</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(statusLabel)}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Tidak ada produk yang sesuai dengan filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
