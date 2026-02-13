"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import {
  catalogCategories,
  initialCatalogProducts,
  type CatalogCategory,
  type CatalogProduct,
} from "@/lib/catalog"

type CatalogProductInput = Omit<CatalogProduct, "id">

type CatalogContextType = {
  products: CatalogProduct[]
  categories: CatalogCategory[]
  addProduct: (product: CatalogProductInput) => void
  updateProduct: (id: number, updates: Partial<CatalogProduct>) => void
  removeProduct: (id: number) => void
  adjustStock: (id: number, delta: number) => void
  setStock: (id: number, stock: number) => void
  getProduct: (id: number) => CatalogProduct | undefined
}

const STORAGE_KEY = "catalog_products"
const CatalogContext = createContext<CatalogContextType | null>(null)

const defaultCategoryId =
  catalogCategories.some(
    (category) => category.id === "accessories"
  )
    ? "accessories"
    : (catalogCategories[0]?.id ?? "accessories")

const categoryAliasMap: Record<string, string> = {
  accessories: "accessories",
  chair: "chair",
  deskmat: "mousepad",
  "docking-station": "gamepad",
  "game-pad": "gamepad",
  gamepad: "gamepad",
  keyboard: "keyboard",
  kursi: "chair",
  meja: "accessories",
  monitor: "monitor",
  mouse: "mouse",
  mousepad: "mousepad",
  "holder-stand": "accessories",
}

type ApiCatalogProduct = {
  id?: number
  name?: string
  price?: number
  image?: string | null
  category?: string | null
  category_name?: string | null
  category_slug?: string | null
  stock?: number
  sku?: string
}

const createSku = (id: number) => `PRD-${String(id).padStart(4, "0")}`

function buildFallback(id: number): CatalogProduct {
  return {
    id,
    name: `Produk ${id}`,
    price: 0,
    image: "",
    category: defaultCategoryId,
    stock: 0,
    sku: createSku(id),
  }
}

function normalizeProduct(
  raw: Partial<CatalogProduct>,
  fallback: CatalogProduct
): CatalogProduct {
  const id = Number.isFinite(raw.id)
    ? Number(raw.id)
    : fallback.id

  const name =
    typeof raw.name === "string" && raw.name.trim()
      ? raw.name.trim()
      : fallback.name

  const price = Number.isFinite(raw.price)
    ? Number(raw.price)
    : fallback.price

  const image =
    typeof raw.image === "string" && raw.image.trim()
      ? raw.image.trim()
      : fallback.image

  const category =
    typeof raw.category === "string" && raw.category
      ? raw.category
      : fallback.category

  const stock = Number.isFinite(raw.stock)
    ? Math.max(0, Math.floor(Number(raw.stock)))
    : fallback.stock

  const sku =
    typeof raw.sku === "string" && raw.sku.trim()
      ? raw.sku.trim()
      : fallback.sku

  return {
    id,
    name,
    price: Math.max(0, price),
    image,
    category,
    stock,
    sku,
  }
}

function normalizeProducts(raw: unknown): CatalogProduct[] {
  if (!Array.isArray(raw)) {
    return initialCatalogProducts
  }

  return raw.map((item, index) => {
    const rawProduct = item as Partial<CatalogProduct>
    const fallback =
      initialCatalogProducts.find(
        (product) => product.id === Number(rawProduct.id)
      ) ??
      initialCatalogProducts[index] ??
      buildFallback(index + 1)

    return normalizeProduct(rawProduct, fallback)
  })
}

function normalizeCategoryId(rawCategory: unknown): string {
  if (typeof rawCategory !== "string" || !rawCategory.trim()) {
    return defaultCategoryId
  }

  const normalized = rawCategory
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")

  if (categoryAliasMap[normalized]) {
    return categoryAliasMap[normalized]
  }

  if (
    catalogCategories.some((category) => category.id === normalized)
  ) {
    return normalized
  }

  return defaultCategoryId
}

function normalizeApiProducts(raw: unknown): CatalogProduct[] {
  const productList = (() => {
    if (Array.isArray(raw)) return raw
    if (
      raw &&
      typeof raw === "object" &&
      Array.isArray((raw as { products?: unknown }).products)
    ) {
      return (raw as { products: unknown[] }).products
    }
    return []
  })()

  return productList
    .map((item) => {
      const rawProduct = item as ApiCatalogProduct
      const parsedId = Number(rawProduct.id)
      if (!Number.isFinite(parsedId)) {
        return null
      }

      const fallback =
        initialCatalogProducts.find(
          (product) => product.id === parsedId
        ) ?? buildFallback(parsedId)

      return normalizeProduct(
        {
          id: parsedId,
          name: rawProduct.name,
          sku: rawProduct.sku,
          price: Number(rawProduct.price),
          stock: Number(rawProduct.stock),
          image:
            typeof rawProduct.image === "string"
              ? rawProduct.image
              : fallback.image,
          category: normalizeCategoryId(
            rawProduct.category_slug ??
              rawProduct.category ??
              rawProduct.category_name
          ),
        },
        fallback
      )
    })
    .filter(
      (product): product is CatalogProduct =>
        product !== null
    )
}

export function CatalogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [products, setProducts] = useState<CatalogProduct[]>(
    () => initialCatalogProducts
  )
  const [isHydrated, setIsHydrated] = useState(false)

  const refreshProducts = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(
          "/api/catalog-products",
          {
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            signal,
          }
        )

        if (!response.ok) {
          throw new Error(
            `Failed to fetch catalog products (status: ${response.status})`
          )
        }

        const payload = await response.json()
        const nextProducts =
          normalizeApiProducts(payload)

        if (nextProducts.length > 0) {
          setProducts(nextProducts)
        }
      } catch (error) {
        if (signal?.aborted) return
        console.error(
          "Failed to sync catalog products from API:",
          error
        )
      }
    },
    []
  )

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProducts(normalizeProducts(parsed))
      } catch (error) {
        console.error(
          "Failed to parse catalog data from localStorage:",
          error
        )
        setProducts(initialCatalogProducts)
      }
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
      )
    }
  }, [products, isHydrated])

  useEffect(() => {
    if (!isHydrated) return

    const controller = new AbortController()
    void refreshProducts(controller.signal)

    return () => {
      controller.abort()
    }
  }, [isHydrated, refreshProducts])

  useEffect(() => {
    if (!isHydrated) return

    const handleFocus = () => {
      void refreshProducts()
    }

    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [isHydrated, refreshProducts])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return

      if (!event.newValue) {
        setProducts(initialCatalogProducts)
        return
      }

      try {
        const parsed = JSON.parse(event.newValue)
        setProducts(normalizeProducts(parsed))
      } catch (error) {
        console.error(
          "Failed to parse catalog data from storage event:",
          error
        )
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  function addProduct(product: CatalogProductInput) {
    setProducts((prev) => {
      const nextId = prev.length
        ? Math.max(...prev.map((item) => item.id)) + 1
        : 1
      const nextProduct: CatalogProduct = {
        id: nextId,
        name: product.name.trim(),
        price: Math.max(0, Number(product.price)),
        image: product.image.trim(),
        category: product.category,
        stock: Math.max(0, Math.floor(Number(product.stock))),
        sku: product.sku?.trim() || createSku(nextId),
      }

      return [...prev, nextProduct]
    })
  }

  function updateProduct(
    id: number,
    updates: Partial<CatalogProduct>
  ) {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== id) return product

        const nextName =
          typeof updates.name === "string" && updates.name.trim()
            ? updates.name.trim()
            : product.name

        const nextPrice = Number.isFinite(updates.price)
          ? Math.max(0, Number(updates.price))
          : product.price

        const nextImage =
          typeof updates.image === "string" && updates.image.trim()
            ? updates.image.trim()
            : product.image

        const nextCategory =
          typeof updates.category === "string" && updates.category
            ? updates.category
            : product.category

        const nextStock = Number.isFinite(updates.stock)
          ? Math.max(0, Math.floor(Number(updates.stock)))
          : product.stock

        const nextSku =
          typeof updates.sku === "string" && updates.sku.trim()
            ? updates.sku.trim()
            : product.sku

        return {
          ...product,
          name: nextName,
          price: nextPrice,
          image: nextImage,
          category: nextCategory,
          stock: nextStock,
          sku: nextSku,
        }
      })
    )
  }

  function removeProduct(id: number) {
    setProducts((prev) => prev.filter((item) => item.id !== id))
  }

  function adjustStock(id: number, delta: number) {
    if (!Number.isFinite(delta) || delta === 0) return

    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              stock: Math.max(0, product.stock + delta),
            }
          : product
      )
    )
  }

  function setStock(id: number, stock: number) {
    if (!Number.isFinite(stock)) return

    const nextStock = Math.max(
      0,
      Math.floor(Number(stock))
    )

    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              stock: nextStock,
            }
          : product
      )
    )
  }

  function getProduct(id: number) {
    return products.find((product) => product.id === id)
  }

  return (
    <CatalogContext.Provider
      value={{
        products,
        categories: catalogCategories,
        addProduct,
        updateProduct,
        removeProduct,
        adjustStock,
        setStock,
        getProduct,
      }}
    >
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error(
      "useCatalog must be used within CatalogProvider"
    )
  }
  return context
}

export function useCatalogOptional() {
  return useContext(CatalogContext)
}
