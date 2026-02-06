import { ShoppingCart } from "lucide-react"
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
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/layouts/app/context/CartContext"
import { useCatalog } from "@/layouts/app/context/CatalogContext"
import RootLayout from "@/layouts/app/RootLayouts"
import { catalogCategories, type CatalogProduct } from "@/lib/catalog"

export default function KatalogPage() {
  return (
    <RootLayout>
      <KatalogContent />
    </RootLayout>
  )
}

function KatalogContent() {
  const { products } = useCatalog()
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleAddToCart = (product: CatalogProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })

    toast({
      title: "Berhasil 🛒",
      description: `${product.name} masuk ke keranjang`,
      duration: 1500,
    })
  }

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products

  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/katalog">
                Katalog
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">Katalog Produk </h1>

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

                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Tambah ke Keranjang
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Tidak ada produk dalam kategori ini
            </p>
          </div>
        )}
      </div>
    </>
  )
}
