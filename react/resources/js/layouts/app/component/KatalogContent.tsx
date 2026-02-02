"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/layouts/app/context/CartContext"

export default function KatalogContent() {
  const { addToCart } = useCart()

  const products = [
    { id: 1, name: "Smartphone X", price: 5000000 },
    { id: 2, name: "Headphone Y", price: 1500000 },
    { id: 3, name: "Laptop Z", price: 12000000 },
  ]

  return (
    <div className="p-6 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <Card key={p.id}>
          <CardHeader>
            <CardTitle>{p.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-bold">Rp {p.price.toLocaleString()}</div>
            <Button
              className="w-full mt-2"
              onClick={() => {
                addToCart(p)
                alert(`${p.name} berhasil ditambahkan ke keranjang 🛒`)
              }}
            >
              Tambah ke Keranjang
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
