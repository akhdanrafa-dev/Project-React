import { Head } from '@inertiajs/react'
import { Search, Edit2, Eye, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StaffPageHeader } from "@/layouts/app/component/StaffPageHeader"
import { useCatalog } from "@/layouts/app/context/CatalogContext"
import AppLayout from '@/layouts/app-layout';
import type { CatalogProduct } from "@/lib/catalog"
import type { BreadcrumbItem as BreadcrumbItemData } from '@/types';

const breadcrumbs: BreadcrumbItemData[] = [
    {
        title: 'Kelola Produk',
        href: '/kelola-produk',
    },
];

const SKU_PREFIX = 'PRD-'
const SKU_PADDING = 4
const SKU_PATTERN = /^PRD-(\d+)$/i

const getNextSku = (products: CatalogProduct[]) => {
  const highestSkuNumber = products.reduce((highest, product) => {
    const matchedNumber = product.sku.trim().match(SKU_PATTERN)?.[1]
    if (!matchedNumber) return highest

    const parsedNumber = Number(matchedNumber)
    if (!Number.isFinite(parsedNumber)) return highest

    return Math.max(highest, parsedNumber)
  }, 0)

  return `${SKU_PREFIX}${String(highestSkuNumber + 1).padStart(SKU_PADDING, '0')}`
}

export default function StaffKelolaProduk() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Kelola Produk" />
      <StaffPageHeader
        items={[
          { label: "Beranda", href: "/staff-dashboard" },
          { label: "Kelola Produk", href: "/kelola-produk" },
        ]}
      />
      <StaffKelolaProdukContent />
    </AppLayout>
  )
}

function StaffKelolaProdukContent() {
  const { products, categories, addProduct, updateProduct, removeProduct } = useCatalog()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
  const [selectedStockFilter, setSelectedStockFilter] = useState<'banyak' | 'cukup' | 'sedikit' | 'habis' | null>(null)
  const getDefaultNewProduct = () => ({
    name: '',
    sku: getNextSku(products),
    category: '',
    price: '',
    stock: '',
    image: '',
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CatalogProduct | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [newProduct, setNewProduct] = useState(() => getDefaultNewProduct())
  const [editProduct, setEditProduct] = useState(() => ({
    name: '',
    sku: '',
    category: '',
    price: '',
    discount: '0',
    stock: '',
    image: '',
  }))

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategoryFilter(categoryId)
  }

  const handleStockFilter = (value: 'banyak' | 'cukup' | 'sedikit' | 'habis' | null) => {
    setSelectedStockFilter(value)
  }

  const resetNewProduct = () => {
    setNewProduct(getDefaultNewProduct())
  }

  const resetEditProduct = () => {
    setEditProduct({
      name: '',
      sku: '',
      category: '',
      price: '',
      discount: '0',
      stock: '',
      image: '',
    })
  }

  const handleCreateProduct = async () => {
    setFormError(null)

    const trimmedName = newProduct.name.trim()
    const trimmedSku = newProduct.sku.trim()
    const selectedCategory = newProduct.category
      ? categories.find((category) => category.id === newProduct.category)
      : null
    const priceValue = Number(newProduct.price)
    const stockValue = Number(newProduct.stock)

    if (!trimmedName) {
      setFormError('Nama produk wajib diisi.')
      return
    }
    if (!trimmedSku) {
      setFormError('SKU wajib diisi.')
      return
    }
    if (!selectedCategory) {
      setFormError('Pilih kategori produk.')
      return
    }
    if (newProduct.price.trim() === '') {
      setFormError('Harga wajib diisi.')
      return
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setFormError('Harga harus berupa angka yang valid.')
      return
    }
    if (newProduct.stock.trim() === '') {
      setFormError('Stok wajib diisi.')
      return
    }
    if (!Number.isFinite(stockValue) || stockValue < 0 || !Number.isInteger(stockValue)) {
      setFormError('Stok harus berupa angka bulat yang valid.')
      return
    }

    setIsSubmitting(true)
    try {
      await addProduct({
        name: trimmedName,
        sku: trimmedSku,
        category: selectedCategory.id,
        price: priceValue,
        stock: stockValue,
        image: newProduct.image.trim(),
      })
      setIsCreateDialogOpen(false)
      resetNewProduct()
    } catch (error) {
      console.error('Error creating product:', error)
      setFormError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menambahkan produk.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openViewDialog = (product: CatalogProduct) => {
    setSelectedProduct(product)
    setIsViewDialogOpen(true)
  }

  const openEditDialog = (product: CatalogProduct) => {
    setSelectedProduct(product)
    setEditError(null)
    setEditProduct({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      discount: String(product.discount ?? 0),
      stock: String(product.stock),
      image: product.image ?? '',
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (product: CatalogProduct) => {
    setDeleteTarget(product)
    setDeleteError(null)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return

    setEditError(null)

    const trimmedName = editProduct.name.trim()
    const trimmedSku = editProduct.sku.trim()
    const selectedCategory = editProduct.category
      ? categories.find((category) => category.id === editProduct.category)
      : null
    const priceValue = Number(editProduct.price)
    const discountValue = Number(editProduct.discount)
    const stockValue = Number(editProduct.stock)

    if (!trimmedName) {
      setEditError('Nama produk wajib diisi.')
      return
    }
    if (!trimmedSku) {
      setEditError('SKU wajib diisi.')
      return
    }
    if (!selectedCategory) {
      setEditError('Pilih kategori produk.')
      return
    }
    if (editProduct.price.trim() === '') {
      setEditError('Harga wajib diisi.')
      return
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setEditError('Harga harus berupa angka yang valid.')
      return
    }
    if (editProduct.discount.trim() === '') {
      setEditError('Diskon wajib diisi.')
      return
    }
    if (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > 100) {
      setEditError('Diskon harus berupa angka 0 sampai 100.')
      return
    }
    if (editProduct.stock.trim() === '') {
      setEditError('Stok wajib diisi.')
      return
    }
    if (!Number.isFinite(stockValue) || stockValue < 0 || !Number.isInteger(stockValue)) {
      setEditError('Stok harus berupa angka bulat yang valid.')
      return
    }

    setIsEditSubmitting(true)
    try {
      await updateProduct(selectedProduct.id, {
        name: trimmedName,
        sku: trimmedSku,
        category: selectedCategory.id,
        price: priceValue,
        discount: discountValue,
        stock: stockValue,
        image: editProduct.image.trim(),
      })
      setIsEditDialogOpen(false)
      setSelectedProduct(null)
      resetEditProduct()
    } catch (error) {
      console.error('Error updating product:', error)
      setEditError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui produk.')
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return

    setDeleteError(null)
    setIsDeleteSubmitting(true)

    try {
      await removeProduct(deleteTarget.id)

      if (selectedProduct?.id === deleteTarget.id) {
        setSelectedProduct(null)
        setIsViewDialogOpen(false)
        setIsEditDialogOpen(false)
        resetEditProduct()
      }

      setIsDeleteDialogOpen(false)
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      setDeleteError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus produk.')
    } finally {
      setIsDeleteSubmitting(false)
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredProducts = products.filter((product) => {
    const matchesSearch = normalizedSearch.length === 0
      || product.name.toLowerCase().includes(normalizedSearch)
      || product.sku.toLowerCase().includes(normalizedSearch)
    const matchesCategory = !selectedCategoryFilter
      || product.category === selectedCategoryFilter
    const matchesStock = (() => {
      if (!selectedStockFilter) return true

      switch (selectedStockFilter) {
        case 'banyak':
          return product.stock >= 50
        case 'cukup':
          return product.stock >= 15 && product.stock < 50
        case 'sedikit':
          return product.stock > 0 && product.stock <= 10
        case 'habis':
          return product.stock === 0
        default:
          return true
      }
    })()

    return matchesSearch && matchesCategory && matchesStock
  })

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`
  }

  const getFinalPrice = (price: number, discount?: number) => {
    const safePrice = Number.isFinite(price) ? Math.max(0, Number(price)) : 0
    const safeDiscount = Number.isFinite(discount)
      ? Math.min(100, Math.max(0, Number(discount)))
      : 0

    return Math.max(0, safePrice - (safePrice * safeDiscount) / 100)
  }

  const formatDiscount = (discount?: number) => {
    const safeDiscount = Number.isFinite(discount)
      ? Number(discount)
      : 0

    return `${safeDiscount.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.name ?? categoryId
  }

  return (
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
            onChange={(e) => handleCategoryFilter(e.target.value || null)}
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
            value={selectedStockFilter ?? ''}
            onChange={(e) => handleStockFilter((e.target.value as 'banyak' | 'cukup' | 'sedikit' | 'habis') || null)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">Semua Stok</option>
            <option value="banyak">Banyak</option>
            <option value="cukup">Cukup</option>
            <option value="sedikit">Sedikit</option>
            <option value="habis">Habis</option>
          </select>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Daftar Produk</h2>
            <p className="text-muted-foreground">Total {filteredProducts.length} produk</p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              setFormError(null)
              resetNewProduct()
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Tambah Produk Baru</DialogTitle>
                <DialogDescription>
                  Lengkapi informasi produk untuk menambah ke katalog.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="product-name">Nama Produk</Label>
                  <Input
                    id="product-name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Masukkan nama produk"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Masukkan SKU produk"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-category">Kategori</Label>
                  <select
                    id="product-category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product-price">Harga</Label>
                    <Input
                      id="product-price"
                      type="number"
                      min="0"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-stock">Stok</Label>
                    <Input
                      id="product-stock"
                      type="number"
                      min="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="0"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-image">URL Gambar (Opsional)</Label>
                  <Input
                    id="product-image"
                    type="url"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    placeholder="https://..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button onClick={handleCreateProduct} disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'
                  }}
                />
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-2">{product.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-lg font-semibold text-green-600">
                  {formatPrice(getFinalPrice(product.price, product.discount))}
                </p>
                {(product.discount ?? 0) > 0 && (
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground line-through">
                      Harga asli {formatPrice(product.price)}
                    </p>
                    <p className="font-medium text-orange-600">
                      Diskon {formatDiscount(product.discount)}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Stok: {product.stock} unit
                </p>

                <div className="rounded-md border border-border/60 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full min-w-0 px-2 text-xs"
                      onClick={() => openViewDialog(product)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Lihat</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full min-w-0 px-2 text-xs"
                      onClick={() => openEditDialog(product)}
                    >
                      <Edit2 className="mr-1 h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Edit</span>
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2 h-8 w-full min-w-0 px-2 text-xs"
                    onClick={() => openDeleteDialog(product)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Hapus</span>
                  </Button>
                </div>
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

      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open)
          if (!open) {
            setSelectedProduct(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Detail Produk</DialogTitle>
            <DialogDescription>
              Informasi lengkap produk yang dipilih.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'
                  }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kategori</span>
                  <span className="font-medium">{getCategoryName(selectedProduct.category)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Harga Asli</span>
                  <span className="font-semibold text-green-600">{formatPrice(selectedProduct.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Diskon</span>
                  <span className="font-medium">{formatDiscount(selectedProduct.discount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Harga Akhir</span>
                  <span className="font-semibold text-green-600">
                    {formatPrice(getFinalPrice(selectedProduct.price, selectedProduct.discount))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stok</span>
                  <span className="font-medium">{selectedProduct.stock} unit</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setEditError(null)
            setSelectedProduct(null)
            resetEditProduct()
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>
              Perbarui informasi produk yang dipilih.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-product-name">Nama Produk</Label>
              <Input
                id="edit-product-name"
                value={editProduct.name}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                placeholder="Masukkan nama produk"
                disabled={isEditSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-product-sku">SKU</Label>
              <Input
                id="edit-product-sku"
                value={editProduct.sku}
                onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })}
                placeholder="Masukkan SKU produk"
                disabled={isEditSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-product-category">Kategori</Label>
              <select
                id="edit-product-category"
                value={editProduct.category}
                onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                disabled={isEditSubmitting}
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-product-price">Harga</Label>
                <Input
                  id="edit-product-price"
                  type="number"
                  min="0"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  placeholder="0"
                  disabled={isEditSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-product-discount">Diskon (%)</Label>
                <Input
                  id="edit-product-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editProduct.discount}
                  onChange={(e) => setEditProduct({ ...editProduct, discount: e.target.value })}
                  placeholder="Contoh: 10"
                  disabled={isEditSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-product-stock">Stok</Label>
                <Input
                  id="edit-product-stock"
                  type="number"
                  min="0"
                  value={editProduct.stock}
                  onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                  placeholder="0"
                  disabled={isEditSubmitting}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-product-image">URL Gambar (Opsional)</Label>
              <Input
                id="edit-product-image"
                type="url"
                value={editProduct.image}
                onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })}
                placeholder="https://..."
                disabled={isEditSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditSubmitting}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isEditSubmitting}>
              {isEditSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open && !isDeleteSubmitting) {
            setDeleteError(null)
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Produk "${deleteTarget.name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                : 'Produk akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteSubmitting}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleteSubmitting || !deleteTarget}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteProduct()
              }}
            >
              {isDeleteSubmitting ? 'Menghapus...' : 'Hapus Produk'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
