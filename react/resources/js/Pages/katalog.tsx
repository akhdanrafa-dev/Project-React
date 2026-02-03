import { ShoppingCart, Keyboard, Mouse, Lightbulb, Monitor, Package } from "lucide-react"
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
import RootLayout from "@/layouts/app/RootLayouts"

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

interface Product {
  id: number
  name: string
  price: number
  image: string
  category: string
}

const CATEGORIES: Category[] = [
  {
    id: "keyboard",
    name: "Keyboard",
    icon: <Keyboard className="h-5 w-5" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  },
  {
    id: "mouse",
    name: "Mouse",
    icon: <Mouse className="h-5 w-5" />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  },
  {
    id: "mousepad",
    name: "Mousepad",
    icon: <Lightbulb className="h-5 w-5" />,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  },
  {
    id: "monitor",
    name: "Monitor",
    icon: <Monitor className="h-5 w-5" />,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  },
  {
    id: "accessories",
    name: "Accessories",
    icon: <Package className="h-5 w-5" />,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  },
  {
    id: "gamepad",
    name: "Gamepad",
    icon: <Package className="h-5 w-5" />,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
  },
  {
    id: "chair",
    name: "Chair",
    icon: <Package className="h-5 w-5" />,
    color: "bg-gray-100 text-white-700 dark:bg-gray-900 dark:text-gray-200",
  },
]

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Vortex Mono Series Layout 65%/75%/83%/87%/100%",
    price: 369000,
    image: "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-143215499/vortex_series_vortexseries_mono_series_65_-_75_-_87_layout_flexcut_wired_gasket_mount_keyboard_full03_mgtq582o.jpg",
    category: "keyboard",
  },
  {
    id: 2,
    name: "Ajazz Ak820 Monochrome 75% v2",
    price: 299000,
    image: "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-143101682/ajazz_ajazz_ak820_monochrome_-_mechanical_keyboard_full03_rsbvkk6i.jpg",
    category: "keyboard",
  },
  {
    id: 3,
    name: "Furycube G11 Mouse Wireless ",
    price: 265000,
    image: "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/96/MTA-182618402/furycube_furycube_g11_-_g-11_ultra_lightweight_wireless_gaming_mouse_paw3311_full02_jbdwjvnv.jpg",
    category: "mouse",
  },
  {
    id: 4,
    name: "Mouse NYK Nemesis Riot mq10, Mouse + Docking",
    price: 154000,
    image: "https://down-id.img.susercontent.com/file/id-11134207-7rasi-m5ds47okj4sm07.webp",
    category: "mouse",
  },
  {
    id: 5,
    name: "Fantech x Kobo Kanaeru Mousepad",
    price: 209000,
    image: "https://fantech.id/cdn/shop/files/MAINPIC-DESKMATKOBOFINAL.webp?v=1757398074&width=533",
    category: "mousepad",
  },
  {
    id: 6,
    name: "Fantech x Kobo Kanaeru Mouse",
    price: 249000,
    image: "https://fantech.id/cdn/shop/files/MAINPIC-WG9KOBOHOLOLIVEFINAL.webp?v=1757386512",
    category: "mouse",
  },
  {
    id: 7,
    name: "Fantech x Vestia Zeta Mousepad",
    price: 209000,
    image: "https://fantech.id/cdn/shop/files/MAINPIC-DESKMATZETAFINAL.webp?v=1757393609&width=533",
    category: "mousepad",
  },
  {
    id: 8,
    name: "Fantech x Vestia Zeta Mouse",
    price: 249000,
    image: "https://fantech.id/cdn/shop/files/MAINPIC-WG9ZETAHOLOLIVEFINAL.webp?v=1757392944",
    category: "mouse",
  },
  {
    id: 9,
    name: "Monitor Xiaomi G24i 2026!, 200Hz FAST IPS FHD",
    price: 1495000,
    image: "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-178490843/xiaomi_monitor_led_xiaomi_g24i_24-_fast_ips_1080p_fhd_180hz_1ms_gtg_hdmi_2-0x1_dp_1-4x1_hdr_calibrated_individually_rapid_response_low_latency_freesync_silky_full02_e1enb7wz.webp",
    category: "monitor",
  },
  {
    id: 10,
    name: "Monitor Xiaomi A24i 2026!, 144Hz FAST IPS FHD",
    price: 1346000,
    image: "https://down-id.img.susercontent.com/file/id-11134207-8224w-mk0fl6pk2jnk94.webp",
    category: "monitor",
  },
  {
    id: 11,
    name: "Kursi Kantor Ergonomic, Nyaman Untuk Kerja Lama",
    price: 484000,
    image: "https://down-id.img.susercontent.com/file/id-11134207-81ztm-mdy3znad8r2df6.webp",
    category: "chair",
  },
  {
    id: 12,
    name: "Stand Mouse Universal Murah",
    price: 9000,
    image: "https://down-id.img.susercontent.com/file/sg-11134201-7ravq-maz6ojp343tu0c.webp",
    category: "accessories",
  },
  {
    id: 13,
    name: "Stand Laptop Dapat Diputar 360 Derajat",
    price: 129000,
    image: "https://down-id.img.susercontent.com/file/id-11134207-82251-mh5vdql5ua6l3a.webp",
    category: "accessories",
  },
  {
    id: 14,
    name: "NYK Nemesis Cronus GPX900 Gamepad",
    price: 280000,
    image: "https://down-id.img.susercontent.com/file/id-11134207-81zto-me8xh4zhy96v26.webp",
    category: "gamepad",
  },
  {
    id: 15,
    name: "FLYDIGI Apex 5 Wireless Gamepad For PC",
    price: 2490000,
    image: "https://down-id.img.susercontent.com/file/id-11134207-81ztk-meo4vzhy3ymb79.webp",
    category: "gamepad",
  },
  {
    id: 16,
    name: "Keycaps Topography Side Print Purple",
    price: 199000,
    image: "https://down-id.img.susercontent.com/file/id-11134207-81ztc-mf7qlksrkhe731.webp",
    category: "accessories",
  },
]

export default function KatalogPage() {
  return (
    <RootLayout>
      <KatalogContent />
    </RootLayout>
  )
}

function KatalogContent() {
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleAddToCart = (product: Product) => {
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
    ? PRODUCTS.filter((p) => p.category === selectedCategory)
    : PRODUCTS

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
              Semua Produk ({PRODUCTS.length})
            </Button>

            {CATEGORIES.map((category) => {
              const count = PRODUCTS.filter((p) => p.category === category.id).length
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`gap-2 ${selectedCategory === category.id ? "" : category.color}`}
                >
                  {category.icon}
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

              <CardContent className="space-y-4">
                <p className="text-lg font-semibold text-green-600">
                  Rp {product.price.toLocaleString("id-ID")}
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
