"use client"

import { createContext, useContext, useEffect, useState } from "react"

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
  getProduct: (id: number) => CatalogProduct | undefined
}

const STORAGE_KEY = "catalog_products"
const CatalogContext = createContext<CatalogContextType | null>(null)

const defaultCategoryId =
  catalogCategories[0]?.id ?? "accessories"

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

export function CatalogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [products, setProducts] = useState<CatalogProduct[]>(
    () => initialCatalogProducts
  )
  const [isHydrated, setIsHydrated] = useState(false)

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
