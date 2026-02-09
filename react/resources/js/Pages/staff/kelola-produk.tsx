import { Head, router } from '@inertiajs/react'
import { Search, Edit2, Trash2, Eye } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  category_id: number;
  price: number;
  stock: number;
  status: string;
  description?: string;
  image?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Produk',
        href: '/kelola-produk',
    },
];

interface Props {
  products: Product[];
  categories: Category[];
  selectedCategory?: number | null;
  searchTerm?: string;
  role?: string;
}

export default function StaffKelolaProduk({
  products: initialProducts = [],
  categories = [],
  selectedCategory = null,
  searchTerm: initialSearchTerm = '',
  role,
}: Props) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(selectedCategory)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    router.get('/kelola-produk', {
      search: value,
      category: selectedCategoryFilter,
    }, { preserveState: true })
  }

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategoryFilter(categoryId)
    router.get('/kelola-produk', {
      search: searchTerm,
      category: categoryId,
    }, { preserveState: true })
  }

  const filteredProducts = initialProducts

  const getStatusBadge = (status: string) => {
    if (status === "Active") {
      return "bg-green-100 text-green-800"
    } else if (status === "Low Stock") {
      return "bg-yellow-100 text-yellow-800"
    }
    return "bg-gray-100 text-gray-800"
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Kelola Produk" />

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-3xl font-bold">Kelola Produk</h1>
          <p className="text-sm text-muted-foreground mt-1">Pantau dan kelola semua produk</p>
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
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <select
              value={selectedCategoryFilter ?? ''}
              onChange={(e) => handleCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="relative overflow-hidden">
                {product.image && (
                  <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                      <CardDescription className="mt-1">SKU: {product.sku}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Kategori</span>
                    <span className="text-sm font-medium">{product.category}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Harga</span>
                    <span className="text-lg font-bold text-green-600">{formatPrice(product.price)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stok</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {product.stock} unit
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(product.status)}`}>
                      {product.status}
                    </span>
                  </div>

                  {product.description && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Deskripsi:</span>
                      <p className="text-sm mt-1 line-clamp-2">{product.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
