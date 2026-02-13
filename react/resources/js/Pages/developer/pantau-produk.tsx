import { Head } from "@inertiajs/react"
import { AlertCircle, Search } from "lucide-react"
import { useState } from "react"

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
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { CatalogProvider, useCatalog } from "@/layouts/app/context/CatalogContext"
import DeveloperLayout from "@/layouts/app/DeveloperLayout"
import type { CatalogProduct } from "@/lib/catalog"

type AlertAction = "stock" | "banner" | "price"

const alertActionOptions: Array<{
  value: AlertAction
  label: string
  inputLabel: string
  placeholder: string
  inputType: "number" | "url"
}> = [
  {
    value: "stock",
    label: "Tambah Stock",
    inputLabel: "Jumlah stock ditambahkan",
    placeholder: "Contoh: 25",
    inputType: "number",
  },
  {
    value: "banner",
    label: "Ganti Banner",
    inputLabel: "Link banner baru",
    placeholder: "https://contoh.com/banner.jpg",
    inputType: "url",
  },
  {
    value: "price",
    label: "Ubah Harga",
    inputLabel: "Harga baru (Rupiah)",
    placeholder: "Contoh: 350000",
    inputType: "number",
  },
]

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
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [selectedAlertAction, setSelectedAlertAction] = useState<AlertAction | null>(null)
  const [alertValue, setAlertValue] = useState("")
  const [alertError, setAlertError] = useState<string | null>(null)
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false)

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

  const selectedActionConfig = selectedAlertAction
    ? alertActionOptions.find((action) => action.value === selectedAlertAction) ?? null
    : null

  const closeAlertDialog = () => {
    setSelectedProduct(null)
    setSelectedAlertAction(null)
    setAlertValue("")
    setAlertError(null)
    setIsSubmittingAlert(false)
  }

  const openAlertDialog = (product: CatalogProduct) => {
    setSelectedProduct(product)
    setSelectedAlertAction(null)
    setAlertValue("")
    setAlertError(null)
  }

  const handleSelectAction = (action: AlertAction) => {
    setSelectedAlertAction(action)
    setAlertValue("")
    setAlertError(null)
  }

  const handleSubmitAlert = async () => {
    if (!selectedProduct) {
      return
    }

    if (!selectedAlertAction) {
      setAlertError("Pilih salah satu aksi terlebih dahulu.")
      return
    }

    const trimmedValue = alertValue.trim()
    if (!trimmedValue) {
      setAlertError("Nilai baru wajib diisi.")
      return
    }

    let normalizedValue = trimmedValue
    let description = ""

    if (selectedAlertAction === "stock") {
      const parsedStock = Number(trimmedValue)
      if (!Number.isFinite(parsedStock) || !Number.isInteger(parsedStock) || parsedStock <= 0) {
        setAlertError("Jumlah stock harus angka bulat lebih dari 0.")
        return
      }

      normalizedValue = String(parsedStock)
      description = `Permintaan tambah stock ${parsedStock} unit untuk produk ${selectedProduct.name}.`
    }

    if (selectedAlertAction === "banner") {
      try {
        new URL(trimmedValue)
      } catch {
        setAlertError("Link banner harus berupa URL yang valid.")
        return
      }

      description = `Permintaan ganti banner untuk produk ${selectedProduct.name}.`
    }

    if (selectedAlertAction === "price") {
      const parsedPrice = Number(trimmedValue)
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setAlertError("Harga harus berupa angka lebih dari 0.")
        return
      }

      const normalizedPrice = Math.floor(parsedPrice)
      normalizedValue = String(normalizedPrice)
      description = `Permintaan ubah harga produk ${selectedProduct.name} menjadi ${formatPrice(normalizedPrice)}.`
    }

    setIsSubmittingAlert(true)
    setAlertError(null)

    try {
      const response = await fetch("/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN":
            document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "",
        },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          alert_type: selectedAlertAction,
          new_value: normalizedValue,
          description,
        }),
      })

      const data: {
        message?: string
        errors?: Record<string, string[]>
      } = await response.json().catch(() => ({}))

      if (!response.ok) {
        const validationMessage = data.errors
          ? Object.values(data.errors).flat().find((message) => typeof message === "string")
          : null

        throw new Error(validationMessage ?? data.message ?? "Gagal mengirim notifikasi ke staff.")
      }

      window.alert("Permintaan berhasil dikirim ke halaman staff alerts.")
      closeAlertDialog()
    } catch (error) {
      setAlertError(error instanceof Error ? error.message : "Gagal mengirim notifikasi ke staff.")
    } finally {
      setIsSubmittingAlert(false)
    }
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
            Lihat data produk dan kirim permintaan perubahan ke staff
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => openAlertDialog(product)}
                        title="Kirim permintaan ke staff"
                      >
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </Button>
                    </div>
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

      <Dialog
        open={selectedProduct !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeAlertDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Kirim Notifikasi ke Staff</DialogTitle>
            <DialogDescription>
              Pilih aksi untuk produk <span className="font-medium text-foreground">{selectedProduct?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {alertActionOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={selectedAlertAction === option.value ? "default" : "outline"}
                  onClick={() => handleSelectAction(option.value)}
                  disabled={isSubmittingAlert}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {selectedActionConfig && (
              <div className="space-y-2">
                <Label htmlFor="alert-value-input">{selectedActionConfig.inputLabel}</Label>
                <Input
                  id="alert-value-input"
                  type={selectedActionConfig.inputType}
                  min={selectedAlertAction === "banner" ? undefined : "1"}
                  step={selectedAlertAction === "stock" ? "1" : selectedAlertAction === "price" ? "1000" : undefined}
                  placeholder={selectedActionConfig.placeholder}
                  value={alertValue}
                  onChange={(event) => setAlertValue(event.target.value)}
                  disabled={isSubmittingAlert}
                />
              </div>
            )}

            {alertError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {alertError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeAlertDialog}
              disabled={isSubmittingAlert}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmitAlert}
              disabled={isSubmittingAlert || !selectedAlertAction}
            >
              {isSubmittingAlert ? "Mengirim..." : "Kirim ke Staff Alerts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
