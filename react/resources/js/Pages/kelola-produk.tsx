import { Head, router } from '@inertiajs/react'
import { Search, Edit2, Trash2, Eye, Grid3x3 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
}

export default function KelolaProduk({ 
  products: initialProducts = [],
  categories = [],
  selectedCategory = null,
  searchTerm: initialSearchTerm = '',
}: Props) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(selectedCategory)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleCategorySelect = (categoryId: number) => {
    handleCategoryFilter(categoryId)
    setIsModalOpen(false)
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
      
      <div className="flex flex-1 flex-col gap-6 p-4 overflow-x-auto">
        <div>
          <h1 className="text-3xl font-bold">Kelola Produk</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola dan monitor semua produk</p>
        </div>

        {/* Search Filter */}
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Lihat Semua Kategori
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Daftar Kategori</DialogTitle>
                  <DialogDescription>
                    Pilih kategori untuk memfilter produk
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted">
                        <th className="text-left py-3 px-4 font-semibold">No</th>
                        <th className="text-left py-3 px-4 font-semibold">Nama Kategori</th>
                        <th className="text-left py-3 px-4 font-semibold">Deskripsi</th>
                        <th className="text-center py-3 px-4 font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr key={category.id} className="border-b hover:bg-muted/50 cursor-pointer transition">
                          <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                          <td className="py-3 px-4 font-medium">{category.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{category.description}</td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              size="sm"
                              variant={selectedCategoryFilter === category.id ? "default" : "outline"}
                              onClick={() => handleCategorySelect(category.id)}
                              className="w-full"
                            >
                              {selectedCategoryFilter === category.id ? 'Dipilih' : 'Pilih'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleCategoryFilter(null)
                      setIsModalOpen(false)
                    }}
                    className="w-full"
                  >
                    Tampilkan Semua Produk
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Produk</CardTitle>
            <CardDescription>Total {filteredProducts.length} produk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Nama Produk</th>
                    <th className="text-left py-3 px-2">SKU</th>
                    <th className="text-left py-3 px-2">Kategori</th>
                    <th className="text-left py-3 px-2">Harga</th>
                    <th className="text-left py-3 px-2">Stok</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{product.name}</td>
                      <td className="py-3 px-2 text-muted-foreground">{product.sku}</td>
                      <td className="py-3 px-2">{product.category}</td>
                      <td className="py-3 px-2 font-semibold">{formatPrice(product.price)}</td>
                      <td className="py-3 px-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {product.stock} unit
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
