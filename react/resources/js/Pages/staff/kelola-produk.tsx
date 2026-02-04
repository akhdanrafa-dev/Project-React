import { Head } from "@inertiajs/react"
import { Edit2, Eye, Minus, Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useToast } from "@/components/ui/use-toast"
import { useCatalog } from "@/layouts/app/context/CatalogContext"
import AppLayout from "@/layouts/app-layout"
import type { CatalogProduct } from "@/lib/catalog"

type ProductFormState = {
  name: string
  price: string
  image: string
  category: string
  stock: string
  sku: string
}

export default function StaffKelolaProdukPage() {
  return (
    <AppLayout>
      <Head title="Kelola Produk" />
      <StaffKelolaProdukContent />
    </AppLayout>
  )
}

function StaffKelolaProdukContent() {
  const { toast } = useToast()
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    removeProduct,
    adjustStock,
  } = useCatalog()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [detailProduct, setDetailProduct] = useState<CatalogProduct | null>(null)
  const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const defaultCategory = categories[0]?.id ?? ""

  const createEmptyForm = (category = defaultCategory): ProductFormState => ({
    name: "",
    price: "",
    image: "",
    category,
    stock: "0",
    sku: "",
  })

  const [addForm, setAddForm] = useState<ProductFormState>(() =>
    createEmptyForm()
  )
  const [editForm, setEditForm] = useState<ProductFormState>(() =>
    createEmptyForm()
  )

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]))
  }, [categories])

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory = selectedCategory
        ? product.category === selectedCategory
        : true
      const matchesSearch = term
        ? product.name.toLowerCase().includes(term) ||
          product.sku.toLowerCase().includes(term)
        : true

      return matchesCategory && matchesSearch
    })
  }, [products, searchTerm, selectedCategory])

  const totalStock = filteredProducts.reduce(
    (sum, product) => sum + product.stock,
    0
  )

  const handleOpenAdd = () => {
    setAddForm(createEmptyForm())
    setAddDialogOpen(true)
  }

  const handleOpenEdit = (product: CatalogProduct) => {
    setEditProduct(product)
    setEditForm({
      name: product.name,
      price: String(product.price),
      image: product.image,
      category: product.category,
      stock: String(product.stock),
      sku: product.sku,
    })
    setEditDialogOpen(true)
  }

  const handleDelete = (product: CatalogProduct) => {
    const confirmed = window.confirm(
      `Hapus produk ${product.name}?`
    )

    if (!confirmed) return

    removeProduct(product.id)
    toast({
      title: "Produk dihapus",
      description: product.name,
      duration: 1500,
    })
  }

  const buildPayload = (form: ProductFormState) => {
    const price = Number(form.price)
    const stock = Number(form.stock)

    if (!form.name.trim()) {
      toast({
        title: "Nama produk wajib diisi",
        variant: "destructive",
      })
      return null
    }

    if (!form.category) {
      toast({
        title: "Kategori wajib dipilih",
        variant: "destructive",
      })
      return null
    }

    if (!Number.isFinite(price) || price < 0) {
      toast({
        title: "Harga tidak valid",
        variant: "destructive",
      })
      return null
    }

    if (!Number.isFinite(stock) || stock < 0) {
      toast({
        title: "Stok tidak valid",
        variant: "destructive",
      })
      return null
    }

    if (!form.image.trim()) {
      toast({
        title: "URL gambar wajib diisi",
        variant: "destructive",
      })
      return null
    }

    return {
      name: form.name.trim(),
      price,
      image: form.image.trim(),
      category: form.category,
      stock,
      sku: form.sku.trim(),
    }
  }

  const handleAddProduct = () => {
    const payload = buildPayload(addForm)
    if (!payload) return

    addProduct(payload)
    setAddDialogOpen(false)
    toast({
      title: "Produk ditambahkan",
      description: payload.name,
      duration: 1500,
    })
  }

  const handleEditProduct = () => {
    if (!editProduct) return
    const payload = buildPayload(editForm)
    if (!payload) return

    updateProduct(editProduct.id, payload)
    setEditDialogOpen(false)
    toast({
      title: "Produk diperbarui",
      description: payload.name,
      duration: 1500,
    })
  }

  const getStatusBadge = (stock: number) => {
    if (stock === 0) {
      return { label: "Habis", className: "bg-red-100 text-red-700" }
    }
    if (stock <= 5) {
      return {
        label: "Menipis",
        className: "bg-yellow-100 text-yellow-700",
      }
    }
    return {
      label: "Tersedia",
      className: "bg-green-100 text-green-700",
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/staff-dashboard">
                Staff Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/kelola-produk">
                Kelola Produk
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kelola Produk</h1>
            <p className="text-sm text-muted-foreground">
              Perubahan katalog di sini akan tampil di halaman user dan developer.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProducts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sesuai filter aktif
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Stok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalStock}
              </div>
              <p className="text-xs text-muted-foreground">
                Akumulasi semua produk
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Kategori Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedCategory
                  ? categoryMap.get(selectedCategory) ?? selectedCategory
                  : "Semua"}
              </div>
              <p className="text-xs text-muted-foreground">
                Filter kategori saat ini
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pencarian & Filter</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nama produk atau SKU..."
                className="pl-8"
              />
            </div>
            <Select
              value={selectedCategory ?? "all"}
              onValueChange={(value) =>
                setSelectedCategory(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-2 text-left">Produk</th>
                    <th className="py-3 px-2 text-left">Kategori</th>
                    <th className="py-3 px-2 text-left">Harga</th>
                    <th className="py-3 px-2 text-left">Stok</th>
                    <th className="py-3 px-2 text-left">Status</th>
                    <th className="py-3 px-2 text-left">SKU</th>
                    <th className="py-3 px-2 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const status = getStatusBadge(product.stock)
                    return (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium line-clamp-2">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {product.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {categoryMap.get(product.category) ?? product.category}
                        </td>
                        <td className="py-3 px-2 font-semibold">
                          {formatPrice(product.price)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => adjustStock(product.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="min-w-[32px] text-center">
                              {product.stock}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => adjustStock(product.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`rounded px-2 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {product.sku}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDetailProduct(product)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(product)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Produk tidak ditemukan. Coba ubah filter atau kata kunci.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
            <DialogDescription>
              Lengkapi data produk agar tampil di katalog user dan developer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="add-name">Nama Produk</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(event) =>
                  setAddForm({ ...addForm, name: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="add-price">Harga</Label>
              <Input
                id="add-price"
                type="number"
                min={0}
                value={addForm.price}
                onChange={(event) =>
                  setAddForm({ ...addForm, price: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="add-stock">Stok</Label>
              <Input
                id="add-stock"
                type="number"
                min={0}
                value={addForm.stock}
                onChange={(event) =>
                  setAddForm({ ...addForm, stock: event.target.value })
                }
              />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select
                value={addForm.category}
                onValueChange={(value) =>
                  setAddForm({ ...addForm, category: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-sku">SKU</Label>
              <Input
                id="add-sku"
                value={addForm.sku}
                onChange={(event) =>
                  setAddForm({ ...addForm, sku: event.target.value })
                }
                placeholder="Opsional"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="add-image">URL Gambar</Label>
              <Input
                id="add-image"
                value={addForm.image}
                onChange={(event) =>
                  setAddForm({ ...addForm, image: event.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddProduct}>Simpan Produk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>
              Perbarui informasi produk agar data selalu akurat.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="edit-name">Nama Produk</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm({ ...editForm, name: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Harga</Label>
              <Input
                id="edit-price"
                type="number"
                min={0}
                value={editForm.price}
                onChange={(event) =>
                  setEditForm({ ...editForm, price: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-stock">Stok</Label>
              <Input
                id="edit-stock"
                type="number"
                min={0}
                value={editForm.stock}
                onChange={(event) =>
                  setEditForm({ ...editForm, stock: event.target.value })
                }
              />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, category: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={editForm.sku}
                onChange={(event) =>
                  setEditForm({ ...editForm, sku: event.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-image">URL Gambar</Label>
              <Input
                id="edit-image"
                value={editForm.image}
                onChange={(event) =>
                  setEditForm({ ...editForm, image: event.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditProduct}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detailProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailProduct(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Produk</DialogTitle>
          </DialogHeader>
          {detailProduct && (
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="h-44 w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={detailProduct.image}
                  alt={detailProduct.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="text-lg font-semibold">{detailProduct.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                  <p>
                    {categoryMap.get(detailProduct.category) ??
                      detailProduct.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Harga</p>
                  <p className="font-semibold">
                    {formatPrice(detailProduct.price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stok</p>
                  <p>{detailProduct.stock} unit</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SKU</p>
                  <p>{detailProduct.sku}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailProduct(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
