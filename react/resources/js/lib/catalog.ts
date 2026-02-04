import { Keyboard, Lightbulb, Monitor, Mouse, Package } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface CatalogCategory {
  id: string
  name: string
  icon: LucideIcon
  color: string
}

export interface CatalogProduct {
  id: number
  name: string
  price: number
  image: string
  category: string
  stock: number
  sku: string
}

export const catalogCategories: CatalogCategory[] = [
  {
    id: "keyboard",
    name: "Keyboard",
    icon: Keyboard,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  },
  {
    id: "mouse",
    name: "Mouse",
    icon: Mouse,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  },
  {
    id: "mousepad",
    name: "Mousepad",
    icon: Lightbulb,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  },
  {
    id: "monitor",
    name: "Monitor",
    icon: Monitor,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  },
  {
    id: "accessories",
    name: "Accessories",
    icon: Package,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  },
  {
    id: "gamepad",
    name: "Gamepad",
    icon: Package,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
  },
  {
    id: "chair",
    name: "Chair",
    icon: Package,
    color: "bg-gray-100 text-white-700 dark:bg-gray-900 dark:text-gray-200",
  },
]

const baseProducts = [
  {
    id: 1,
    name: "Vortex Mono Series Layout 65%/75%/83%/87%/100%",
    price: 369000,
    image:
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-143215499/vortex_series_vortexseries_mono_series_65_-_75_-_87_layout_flexcut_wired_gasket_mount_keyboard_full03_mgtq582o.jpg",
    category: "keyboard",
  },
  {
    id: 2,
    name: "Ajazz Ak820 Monochrome 75% v2",
    price: 299000,
    image:
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-143101682/ajazz_ajazz_ak820_monochrome_-_mechanical_keyboard_full03_rsbvkk6i.jpg",
    category: "keyboard",
  },
  {
    id: 3,
    name: "Furycube G11 Mouse Wireless ",
    price: 265000,
    image:
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/96/MTA-182618402/furycube_furycube_g11_-_g-11_ultra_lightweight_wireless_gaming_mouse_paw3311_full02_jbdwjvnv.jpg",
    category: "mouse",
  },
  {
    id: 4,
    name: "Mouse NYK Nemesis Riot mq10, Mouse + Docking",
    price: 154000,
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-7rasi-m5ds47okj4sm07.webp",
    category: "mouse",
  },
  {
    id: 5,
    name: "Fantech x Kobo Kanaeru Mousepad",
    price: 209000,
    image:
      "https://fantech.id/cdn/shop/files/MAINPIC-DESKMATKOBOFINAL.webp?v=1757398074&width=533",
    category: "mousepad",
  },
  {
    id: 6,
    name: "Fantech x Kobo Kanaeru Mouse",
    price: 249000,
    image:
      "https://fantech.id/cdn/shop/files/MAINPIC-WG9KOBOHOLOLIVEFINAL.webp?v=1757386512",
    category: "mouse",
  },
  {
    id: 7,
    name: "Fantech x Vestia Zeta Mousepad",
    price: 209000,
    image:
      "https://fantech.id/cdn/shop/files/MAINPIC-DESKMATZETAFINAL.webp?v=1757393609&width=533",
    category: "mousepad",
  },
  {
    id: 8,
    name: "Fantech x Vestia Zeta Mouse",
    price: 249000,
    image:
      "https://fantech.id/cdn/shop/files/MAINPIC-WG9ZETAHOLOLIVEFINAL.webp?v=1757392944",
    category: "mouse",
  },
  {
    id: 9,
    name: "Monitor Xiaomi G24i 2026!, 200Hz FAST IPS FHD",
    price: 1495000,
    image:
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-178490843/xiaomi_monitor_led_xiaomi_g24i_24-_fast_ips_1080p_fhd_180hz_1ms_gtg_hdmi_2-0x1_dp_1-4x1_hdr_calibrated_individually_rapid_response_low_latency_freesync_silky_full02_e1enb7wz.webp",
    category: "monitor",
  },
  {
    id: 10,
    name: "Monitor Xiaomi A24i 2026!, 144Hz FAST IPS FHD",
    price: 1346000,
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-8224w-mk0fl6pk2jnk94.webp",
    category: "monitor",
  },
  {
    id: 11,
    name: "Kursi Kantor Ergonomic, Nyaman Untuk Kerja Lama",
    price: 484000,
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-81ztm-mdy3znad8r2df6.webp",
    category: "chair",
  },
  {
    id: 12,
    name: "Stand Mouse Universal Murah",
    price: 9000,
    image:
      "https://down-id.img.susercontent.com/file/sg-11134201-7ravq-maz6ojp343tu0c.webp",
    category: "accessories",
  },
  {
    id: 13,
    name: "Stand Laptop Dapat Diputar 360 Derajat",
    price: 129000,
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-82251-mh5vdql5ua6l3a.webp",
    category: "accessories",
  },
  {
    id: 14,
    name: "NYK Nemesis Cronus GPX900 Gamepad",
    price: 280000,
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-81zto-me8xh4zhy96v26.webp",
    category: "gamepad",
  },
  {
    id: 15,
    name: "FLYDIGI Apex 5 Wireless Gamepad For PC",
    price: 2490000,
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-81ztk-meo4vzhy3ymb79.webp",
    category: "gamepad",
  },
  {
    id: 16,
    name: "Keycaps Topography Side Print Purple",
    price: 199000,
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-81ztc-mf7qlksrkhe731.webp",
    category: "accessories",
  },
]

const defaultStockByCategory: Record<string, number> = {
  keyboard: 18,
  mouse: 26,
  mousepad: 22,
  monitor: 8,
  accessories: 30,
  gamepad: 14,
  chair: 6,
}

const createSku = (id: number) => `PRD-${String(id).padStart(4, "0")}`

export const initialCatalogProducts: CatalogProduct[] = baseProducts.map(
  (product, index) => {
    const baseStock = defaultStockByCategory[product.category] ?? 10
    return {
      ...product,
      sku: createSku(product.id),
      stock: baseStock + (index % 3) * 3,
    }
  }
)
