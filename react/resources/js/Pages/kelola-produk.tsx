import { Head, router } from '@inertiajs/react'
import { Search, Edit2, Trash2, Eye, Grid3x3, AlertTriangle, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export default function KelolaProduk({
  products: initialProducts = [],
  categories = [],
  selectedCategory = null,
  searchTerm: initialSearchTerm = '',
  role,
}: Props) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(selectedCategory)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [alertType, setAlertType] = useState<'stock' | 'name' | 'description' | null>(null)
  const [newValue, setNewValue] = useState('')
  const [description, setDescription] = useState('')

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

      <div className="flex flex-1 flex-col gap-6 p-4">
        {/* Debug Info */}
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p><strong>Debug Info:</strong></p>
          <p>Role: {role || 'undefined'}</p>
          <p>Is Developer: {role === 'developer' ? 'Yes' : 'No'}</p>
          <p>Products Count: {filteredProducts.length}</p>
        </div>
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

        {/* Products Grid */}
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
                    {role === 'developer' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product)
                              setAlertType('stock')
                              setNewValue(product.stock.toString())
                              setDescription('')
                            }}
                          >
                            Ubah Stok Produk
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product)
                              setAlertType('name')
                              setNewValue(product.name)
                              setDescription('')
                            }}
                          >
                            Ubah Nama Produk
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product)
                              setAlertType('description')
                              setNewValue('')
                              setDescription('')
                            }}
                          >
                            Ubah Deskripsi Produk
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>



        {/* Form Dialog for Changes */}
        <Dialog open={!!alertType} onOpenChange={(open) => {
          if (!open) {
            setAlertType(null)
            setNewValue('')
            setDescription('')
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {alertType === 'stock' && 'Ubah Stok Produk'}
                {alertType === 'name' && 'Ubah Nama Produk'}
                {alertType === 'description' && 'Ubah Deskripsi Produk'}
              </DialogTitle>
              <DialogDescription>
                Masukkan nilai baru dan keterangan untuk perubahan ini.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedProduct && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Nilai Saat Ini:</p>
                  {alertType === 'stock' && (
                    <p className="text-sm text-blue-800">Stok: <strong>{selectedProduct.stock} unit</strong></p>
                  )}
                  {alertType === 'name' && (
                    <p className="text-sm text-blue-800">Nama: <strong>{selectedProduct.name}</strong></p>
                  )}
                  {alertType === 'description' && (
                    <p className="text-sm text-blue-800">Deskripsi: <strong>{selectedProduct.description || '(Kosong)'}</strong></p>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="newValue">
                  {alertType === 'stock' && 'Stok yang Disarankan'}
                  {alertType === 'name' && 'Nama yang Disarankan'}
                  {alertType === 'description' && 'Deskripsi yang Disarankan'}
                </Label>
                {alertType === 'description' ? (
                  <Textarea
                    id="newValue"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Masukkan deskripsi baru..."
                    className="mt-1"
                  />
                ) : (
                  <Input
                    id="newValue"
                    type={alertType === 'stock' ? 'number' : 'text'}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={
                      alertType === 'stock' ? 'Masukkan stok baru...' :
                      alertType === 'name' ? 'Masukkan nama baru...' : ''
                    }
                    className="mt-1"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="description">Keterangan</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masukkan keterangan perubahan..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAlertType(null)
                    setNewValue('')
                    setDescription('')
                  }}
                >
                  Batal
                </Button>
                <Button
                  onClick={() => {
                    if (selectedProduct && alertType) {
                      const alertData = {
                        product_id: selectedProduct.id,
                        alert_type: alertType,
                        new_value: alertType === 'description' ? newValue : (alertType === 'stock' ? newValue : newValue),
                        description: description
                      }

                      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

                      fetch('/alerts', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-CSRF-TOKEN': csrfToken,
                          'Accept': 'application/json'
                        },
                        body: JSON.stringify(alertData)
                      })
                      .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
                        return response.json()
                      })
                      .then(data => {
                        setAlertType(null)
                        setNewValue('')
                        setDescription('')
                        setSelectedProduct(null)
                        alert('Alert sent to staff successfully!')
                      })
                      .catch(error => {
                        console.error('Error sending alert:', error)
                        alert('Failed to send alert: ' + error.message)
                      })
                    }
                  }}
                >
                  Kirim Peringatan ke Staff
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
